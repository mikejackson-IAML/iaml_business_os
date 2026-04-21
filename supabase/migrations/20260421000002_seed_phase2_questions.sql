-- Phase 2 — Program Experience (Q3–Q12)
-- All shared framework questions (Block 2/3 reuse verbatim).
-- Q5 is conditional on Q4. Q7 and Q11 are matrix. Q7 has a format-dependent row.
-- Date: 2026-04-21

INSERT INTO iaml_evaluations.question_registry
  (question_id, framework, program_code, phase, display_order, prompt, helper_text, answer_type, options, conditional_on, is_required, embeds_to_vector)
VALUES
  (
    'q3', 'shared', NULL, 2, 1,
    'Overall, how would you rate the {{program_name}} program?',
    NULL,
    'enum',
    '{"choices": ["Excellent", "Very Good", "Good", "Fair", "Poor"]}'::jsonb,
    NULL, TRUE, FALSE
  ),
  (
    'q4', 'shared', NULL, 2, 2,
    'How well did the program meet the expectations you had coming in?',
    NULL,
    'enum',
    '{"choices": ["Exceeded", "Met", "Partially met", "Did not meet"]}'::jsonb,
    NULL, TRUE, FALSE
  ),
  (
    'q5', 'shared', NULL, 2, 3,
    'What did you expect that you didn''t get?',
    'Shown because you answered "Partially met" or "Did not meet" above.',
    'open_text',
    '{"placeholder": "A sentence or two is plenty.", "max_length": 2000}'::jsonb,
    '{"question_id": "q4", "operator": "in", "value": ["Partially met", "Did not meet"]}'::jsonb,
    TRUE, TRUE
  ),
  (
    'q6', 'shared', NULL, 2, 4,
    'How was the pacing of the program?',
    NULL,
    'enum',
    '{"choices": ["Too slow", "Slightly slow", "Just right", "Slightly fast", "Too fast"]}'::jsonb,
    NULL, TRUE, FALSE
  ),
  (
    'q7', 'shared', NULL, 2, 5,
    'Rate the following elements of the program:',
    'From 1 (poor) to 5 (excellent).',
    'matrix',
    $json${
      "scale": {
        "min": 1, "max": 5,
        "labels": {"1": "Poor", "2": "Fair", "3": "Good", "4": "Very Good", "5": "Excellent"}
      },
      "rows": [
        {"row_id": "materials",       "label": "Quality of program materials"},
        {"row_id": "qa_time",         "label": "Amount of Q&A and discussion time"},
        {"row_id": "applicability",   "label": "Real-world applicability of content"},
        {"row_id": "depth",           "label": "Depth of legal analysis"},
        {"row_id": "takeaways",       "label": "Practical takeaways you can use immediately"},
        {"row_id": "venue_logistics", "label": "Venue and logistics",                       "applies_to_formats": ["in-person"]},
        {"row_id": "platform_tech",   "label": "Platform experience and tech quality",      "applies_to_formats": ["virtual", "on-demand"]}
      ]
    }$json$::jsonb,
    NULL, TRUE, FALSE
  ),
  (
    'q8', 'shared', NULL, 2, 6,
    'What was the most valuable topic or discussion for you during the program?',
    NULL,
    'open_text',
    '{"placeholder": "The thing you''ll remember most, or that felt most useful.", "max_length": 2000}'::jsonb,
    NULL, TRUE, TRUE
  ),
  (
    'q9', 'shared', NULL, 2, 7,
    'What topic could have been expanded, shortened, or taught differently?',
    NULL,
    'open_text',
    '{"placeholder": "Specific is more useful than general.", "max_length": 2000}'::jsonb,
    NULL, TRUE, TRUE
  ),
  (
    'q10', 'shared', NULL, 2, 8,
    'What labor relations topic did you expect to be covered that wasn''t — or wasn''t covered in enough depth?',
    NULL,
    'open_text',
    '{"placeholder": "Blind spots you hoped we''d hit.", "max_length": 2000}'::jsonb,
    NULL, TRUE, TRUE
  ),
  (
    'q11', 'shared', NULL, 2, 9,
    'Please rate your instructor:',
    'From 1 (poor) to 5 (excellent).',
    'matrix',
    $json${
      "scale": {
        "min": 1, "max": 5,
        "labels": {"1": "Poor", "2": "Below average", "3": "Average", "4": "Above average", "5": "Excellent"}
      },
      "rows": [
        {"row_id": "expertise",      "label": "Subject matter expertise"},
        {"row_id": "clarity",        "label": "Clarity of explanation"},
        {"row_id": "engagement",     "label": "Engagement and presentation style"},
        {"row_id": "insight",        "label": "Practical, real-world insight"},
        {"row_id": "responsiveness", "label": "Responsiveness to questions"}
      ]
    }$json$::jsonb,
    NULL, TRUE, FALSE
  ),
  (
    'q12', 'shared', NULL, 2, 10,
    'Any specific feedback about your instructor — what made them effective, or what could be improved?',
    'Optional.',
    'open_text',
    '{"placeholder": "Optional — skip if nothing comes to mind.", "max_length": 2000}'::jsonb,
    NULL, FALSE, TRUE
  )
ON CONFLICT (question_id) DO NOTHING;
