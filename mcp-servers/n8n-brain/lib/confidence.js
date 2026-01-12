/**
 * Confidence scoring for n8n-brain
 * Calculates confidence scores and determines autonomy level
 */

import { supabase } from "./supabase.js";
import { findSimilarPatterns } from "./patterns.js";
import { getCredential } from "./credentials.js";
import { getErrorFixCount } from "./errors.js";

// Autonomy thresholds
const THRESHOLDS = {
  ASK_FIRST: 40,      // 0-39: Must ask permission
  DO_AND_VERIFY: 80,  // 40-79: Build and verify before activating
  AUTONOMOUS: 100,    // 80-100: Can act autonomously
};

// High-risk services that reduce confidence
const HIGH_RISK_SERVICES = [
  "stripe",
  "payment",
  "billing",
  "email",
  "smtp",
  "sendgrid",
  "mailgun",
  "production",
  "live",
  "customer",
];

/**
 * Calculate confidence score for a task
 */
export async function calculateConfidence({
  task_description,
  services = [],
  node_types = [],
}) {
  const factors = {};
  let score = 0;

  // Factor 1: Pattern Match (0-35 points)
  // Have we built something similar before?
  try {
    const patterns = await findSimilarPatterns({
      description: task_description,
      services,
      limit: 3,
    });

    if (patterns.length > 0) {
      const bestMatch = patterns[0];
      factors.pattern_match = Math.round(bestMatch.similarity_score * 35);
    } else {
      factors.pattern_match = 0;
    }
  } catch (e) {
    factors.pattern_match = 0;
  }
  score += factors.pattern_match;

  // Factor 2: Credentials Mapped (0-25 points)
  // Do we know the credential IDs for all services?
  const credentialResults = [];
  for (const service of services) {
    const cred = await getCredential(service);
    credentialResults.push(cred !== null);
  }
  const credentialsMapped =
    services.length > 0
      ? credentialResults.filter(Boolean).length / services.length
      : 1;
  factors.credentials_mapped = Math.round(credentialsMapped * 25);
  score += factors.credentials_mapped;

  // Factor 3: Error Knowledge (0-20 points)
  // Do we have error fixes for these node types?
  const errorKnowledge = [];
  for (const nodeType of node_types) {
    const fixCount = await getErrorFixCount(nodeType);
    errorKnowledge.push(fixCount > 0);
  }
  const errorCoverage =
    node_types.length > 0
      ? errorKnowledge.filter(Boolean).length / node_types.length
      : 0.5; // Default to 50% if no nodes specified
  factors.error_knowledge = Math.round(errorCoverage * 20);
  score += factors.error_knowledge;

  // Factor 4: Past Success Rate (0-15 points)
  // Based on confidence log for similar tasks
  try {
    const { data: logs } = await supabase
      .from("confidence_log")
      .select("outcome")
      .overlaps("services_involved", services)
      .limit(20);

    if (logs && logs.length > 0) {
      const successCount = logs.filter((l) => l.outcome === "success").length;
      const successRate = successCount / logs.length;
      factors.past_success = Math.round(successRate * 15);
    } else {
      factors.past_success = 5; // Default middle ground if no history
    }
  } catch (e) {
    factors.past_success = 5;
  }
  score += factors.past_success;

  // Factor 5: Risk Assessment (0-5 points)
  // Lower risk = higher bonus
  const isHighRisk = services.some((s) =>
    HIGH_RISK_SERVICES.some(
      (hr) =>
        s.toLowerCase().includes(hr) || task_description.toLowerCase().includes(hr)
    )
  );
  factors.low_risk = isHighRisk ? 0 : 5;
  score += factors.low_risk;

  // Determine recommendation based on thresholds
  let recommendation;
  if (score < THRESHOLDS.ASK_FIRST) {
    recommendation = "ask_first";
  } else if (score < THRESHOLDS.DO_AND_VERIFY) {
    recommendation = "do_and_verify";
  } else {
    recommendation = "autonomous";
  }

  // Identify what's missing
  const missing = [];
  if (factors.pattern_match < 15) {
    missing.push("No similar patterns found in knowledge base");
  }
  if (factors.credentials_mapped < 20) {
    const unmapped = services.filter(
      async (s) => (await getCredential(s)) === null
    );
    if (unmapped.length > 0) {
      missing.push(`Missing credentials for: ${services.join(", ")}`);
    }
  }
  if (factors.error_knowledge < 10) {
    missing.push("Limited error handling knowledge for these node types");
  }
  if (isHighRisk) {
    missing.push("Task involves high-risk services (payment, email, production)");
  }

  // Generate reasoning
  const reasoning = generateReasoning(score, factors, recommendation, missing);

  return {
    score,
    factors,
    reasoning,
    recommendation,
    missing,
    thresholds: THRESHOLDS,
  };
}

/**
 * Generate human-readable reasoning
 */
function generateReasoning(score, factors, recommendation, missing) {
  const parts = [];

  if (recommendation === "autonomous") {
    parts.push(`High confidence (${score}/100) - I can handle this autonomously.`);
  } else if (recommendation === "do_and_verify") {
    parts.push(
      `Moderate confidence (${score}/100) - I'll build and verify before activating.`
    );
  } else {
    parts.push(`Low confidence (${score}/100) - I need to ask some questions first.`);
  }

  // Add factor explanations
  if (factors.pattern_match > 20) {
    parts.push("Found similar patterns in my knowledge base.");
  }
  if (factors.credentials_mapped === 25) {
    parts.push("All required credentials are mapped.");
  } else if (factors.credentials_mapped > 0) {
    parts.push("Some credentials are mapped, but not all.");
  }
  if (factors.error_knowledge > 10) {
    parts.push("Have error handling knowledge for these nodes.");
  }
  if (factors.past_success > 10) {
    parts.push("Good success rate with similar tasks.");
  }
  if (factors.low_risk === 0) {
    parts.push("Caution: involves high-risk services.");
  }

  return parts.join(" ");
}

/**
 * Record an autonomous action and its outcome
 */
export async function recordAction({
  task_description,
  services_involved = [],
  node_types_involved = [],
  confidence_score,
  confidence_factors,
  recommendation,
  action_taken,
  outcome,
  outcome_notes = null,
  pattern_id = null,
}) {
  const { data, error } = await supabase
    .from("confidence_log")
    .insert({
      task_description,
      services_involved,
      node_types_involved,
      confidence_score,
      confidence_factors,
      recommendation,
      action_taken,
      outcome,
      outcome_notes,
      pattern_id,
    })
    .select("id")
    .single();

  if (error) throw error;
  return { log_id: data.id };
}

/**
 * Get success rate for similar tasks (for calibration)
 */
export async function getSuccessRate(services, node_types) {
  const { data, error } = await supabase
    .from("confidence_log")
    .select("outcome")
    .or(`services_involved.ov.{${services.join(",")}},node_types_involved.ov.{${node_types.join(",")}}`)
    .limit(50);

  if (error || !data || data.length === 0) {
    return 0.5; // Default 50% if no data
  }

  const successCount = data.filter((d) => d.outcome === "success").length;
  return successCount / data.length;
}
