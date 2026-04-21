-- Phase 4 — Future Programs & Intelligence (Q17–Q24)
-- Q17: matrix with NAMED columns (registration status) — one row per remaining block.
-- Q18: multi_enum with 'Other' free_text. Marked optional — users registered for every
--      remaining block can skip cleanly.
-- Q19: open_text embeds.
-- Q20: enum, routes conditional Q21.
-- Q21: repeatable_block (NEW answer_type) — Name/Title/Email per entry. Conditional on Q20.
-- Q22–Q24: enums — decision-maker tier, budget cycle, IAML Intelligence interest.
-- Date: 2026-04-21

INSERT INTO iaml_evaluations.question_registry
  (question_id, framework, program_code, phase, display_order, prompt, helper_text, answer_type, options, conditional_on, is_required, embeds_to_vector)
VALUES
  (
    'q17', 'shared', NULL, 4, 1,
    'What is your registration status for the other blocks of the Employee Relations Law Program?',
    'One status per block.',
    'matrix',
    $json${
      "columns": [
        {"value": "already_registered",  "label": "Already registered"},
        {"value": "plan_to_register",    "label": "Plan to register soon"},
        {"value": "considering",         "label": "Considering it"},
        {"value": "not_planning",        "label": "Not planning to attend"},
        {"value": "not_sure",            "label": "Not sure"}
      ],
      "rows": [
        {"row_id": "block2", "label": "Block 2: Discrimination Prevention & Defense"},
        {"row_id": "block3", "label": "Block 3: Special Issues in Employment Law"}
      ]
    }$json$::jsonb,
    NULL, TRUE, FALSE
  ),
  (
    'q18', 'shared', NULL, 4, 2,
    'For any blocks you''re not currently registered for, what''s the main reason?',
    'Optional — skip if you''re registered for everything.',
    'multi_enum',
    $json${
      "choices": [
        {"id": "timing",           "label": "Timing — I'll register when it works with my schedule"},
        {"id": "budget",           "label": "Budget — waiting on next year's training budget"},
        {"id": "see_block1_first", "label": "Want to see how Block 1 applies before committing to more"},
        {"id": "role_mismatch",    "label": "My role doesn't require that subject matter"},
        {"id": "similar_training", "label": "I've received similar training elsewhere"},
        {"id": "not_sure",         "label": "Not sure yet"},
        {"id": "other",            "label": "Other",                                          "free_text": true}
      ]
    }$json$::jsonb,
    NULL, FALSE, FALSE
  ),
  (
    'q19', 'shared', NULL, 4, 3,
    'What other employment law or HR topics are you struggling with that IAML could help address through future programming?',
    NULL,
    'open_text',
    '{"placeholder": "Topics, gaps, or problems you wish someone would cover.", "max_length": 2000}'::jsonb,
    NULL, TRUE, TRUE
  ),
  (
    'q20', 'shared', NULL, 4, 4,
    'Are there colleagues at your organization who would benefit from attending this program or other IAML programs?',
    NULL,
    'enum',
    '{"choices": ["Yes, and I''d be happy to share their names", "Yes, but I''d prefer not to share contact info", "No", "Not sure"]}'::jsonb,
    NULL, TRUE, FALSE
  ),
  (
    'q21', 'shared', NULL, 4, 5,
    'Who should we reach out to?',
    'One person per card. Every field is optional — share as much or as little as you''re comfortable with.',
    'repeatable_block',
    $json${
      "fields": [
        {"field_id": "name",  "label": "Name",  "type": "text"},
        {"field_id": "title", "label": "Title", "type": "text"},
        {"field_id": "email", "label": "Email", "type": "email"}
      ],
      "min_entries": 1,
      "max_entries": 10,
      "add_button_label": "Add another person"
    }$json$::jsonb,
    '{"question_id": "q20", "operator": "eq", "value": "Yes, and I''d be happy to share their names"}'::jsonb,
    TRUE, FALSE
  ),
  (
    'q22', 'shared', NULL, 4, 6,
    'What is your role in training and development decisions at your organization?',
    NULL,
    'enum',
    '{"choices": ["Final decision-maker", "Strong influencer", "Recommender", "Individual attendee with no decision authority"]}'::jsonb,
    NULL, TRUE, FALSE
  ),
  (
    'q23', 'shared', NULL, 4, 7,
    'When does your organization typically approve training budgets for the following year?',
    NULL,
    'enum',
    '{"choices": ["Q1", "Q2", "Q3", "Q4", "Rolling", "Not sure"]}'::jsonb,
    NULL, TRUE, FALSE
  ),
  (
    'q24', 'shared', NULL, 4, 8,
    'IAML is launching an ongoing employment law intelligence platform for HR professionals — including regulatory updates, an AI legal research assistant, and HR scenario simulations. Would you be interested in learning more?',
    NULL,
    'enum',
    '{"choices": ["Yes, very interested", "Maybe, tell me more when it''s available", "Not right now", "Not interested"]}'::jsonb,
    NULL, TRUE, FALSE
  )
ON CONFLICT (question_id) DO NOTHING;
