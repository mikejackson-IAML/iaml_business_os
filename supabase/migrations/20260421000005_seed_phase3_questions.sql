-- Phase 3 — Your Work Situation (Q13–Q16)
-- Q13: 7-row confidence matrix.
-- Q14: multi-select current org issues. 'None of the above' and 'Prefer not to say' are marked
--      exclusive: true — client clears other selections when one is picked, and vice versa.
-- Q15: multi-select NLRB developments. 'Other' is marked free_text: true — client renders an
--      inline text input when it's checked. The option list is config (JSONB), so an admin can
--      add/remove items via a simple SQL update without a redeploy.
-- Q16: open_text, embeds_to_vector for Phoebe semantic retrieval.
-- Date: 2026-04-21

INSERT INTO iaml_evaluations.question_registry
  (question_id, framework, program_code, phase, display_order, prompt, helper_text, answer_type, options, conditional_on, is_required, embeds_to_vector)
VALUES
  (
    'q13', 'shared', NULL, 3, 1,
    'After completing this program, how confident are you in handling each of the following at your organization?',
    'One rating per row.',
    'matrix',
    $json${
      "scale": {
        "min": 1, "max": 5,
        "labels": {
          "1": "Not confident",
          "2": "Somewhat confident",
          "3": "Confident",
          "4": "Very confident",
          "5": "Already doing this well"
        }
      },
      "rows": [
        {"row_id": "union_organizing",     "label": "Recognizing and responding to union organizing activity"},
        {"row_id": "nlrb_ulp",             "label": "Responding to an NLRB unfair labor practice charge"},
        {"row_id": "collective_bargaining","label": "Participating in or advising on collective bargaining"},
        {"row_id": "grievances_arbitration","label": "Handling grievances and arbitration"},
        {"row_id": "work_stoppage",        "label": "Navigating a strike, lockout, or work stoppage"},
        {"row_id": "union_free",           "label": "Maintaining a union-free workplace lawfully"},
        {"row_id": "nlra_communications",  "label": "Advising leadership on NLRA-compliant communications"}
      ]
    }$json$::jsonb,
    NULL, TRUE, FALSE
  ),
  (
    'q14', 'shared', NULL, 3, 2,
    'Is your organization currently dealing with any of the following?',
    'Select all that apply.',
    'multi_enum',
    $json${
      "choices": [
        {"id": "active_union_campaign",   "label": "Active union organizing campaign"},
        {"id": "cba_negotiations",         "label": "Existing collective bargaining agreement negotiations or renewal"},
        {"id": "nlrb_charge",              "label": "Pending NLRB charge or complaint"},
        {"id": "work_stoppage",            "label": "Recent or anticipated strike, lockout, or work stoppage"},
        {"id": "union_free_concerns",      "label": "Union-free workplace maintenance concerns"},
        {"id": "joint_employer",           "label": "Joint employer or contingent workforce issues"},
        {"id": "recent_nlrb_decision",     "label": "Recent NLRB decision impact assessment"},
        {"id": "none",                     "label": "None of the above",                 "exclusive": true},
        {"id": "prefer_not_to_say",        "label": "Prefer not to say",                  "exclusive": true}
      ]
    }$json$::jsonb,
    NULL, TRUE, FALSE
  ),
  (
    'q15', 'shared', NULL, 3, 3,
    'Which recent NLRB developments are most relevant to your work right now?',
    'Select all that apply.',
    'multi_enum',
    $json${
      "choices": [
        {"id": "cemex",             "label": "Cemex bargaining orders"},
        {"id": "joint_employer",    "label": "Joint employer rule"},
        {"id": "captive_audience",  "label": "Captive audience meeting restrictions"},
        {"id": "stericycle",        "label": "Stericycle workplace rules framework"},
        {"id": "section_7_social",  "label": "Section 7 social media activity"},
        {"id": "other",             "label": "Other",                                "free_text": true}
      ]
    }$json$::jsonb,
    NULL, TRUE, FALSE
  ),
  (
    'q16', 'shared', NULL, 3, 4,
    'What is the hardest labor relations situation you''re currently navigating or anticipating at your organization?',
    'Sensitive — this stays internal to IAML.',
    'open_text',
    '{"placeholder": "Briefly describe the situation.", "max_length": 3000}'::jsonb,
    NULL, TRUE, TRUE
  )
ON CONFLICT (question_id) DO NOTHING;
