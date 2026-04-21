-- Phase 5 — Final Thoughts (Q25–Q31) with NPS-branched routing.
-- Promoter path (NPS 9–10): Q25a, Q26a, Q27a
-- Detractor path (NPS 0–6): Q25b, Q26b
-- Passive path (NPS 7–8):   skips branch, still gets Q28–Q31
-- Everyone:                 Q28, Q29, Q30, Q31 (Q31 optional)
--
-- The nps_branch filter in public.eval_get_by_token (Phase 1 migration) already
-- honors these branches against program_evaluations.nps_tier. Seeding sets
-- nps_branch on branch-specific rows; shared rows leave it NULL.
-- Date: 2026-04-21

INSERT INTO iaml_evaluations.question_registry
  (question_id, framework, program_code, phase, display_order, prompt, helper_text, answer_type, options, conditional_on, is_required, embeds_to_vector, nps_branch)
VALUES
  -- ========= Promoter branch =========
  (
    'q25a', 'shared', NULL, 5, 1,
    'In one or two sentences, what was the most valuable part of this program for you?',
    NULL,
    'open_text',
    '{"placeholder": "What you''d tell a colleague about IAML.", "max_length": 1500}'::jsonb,
    NULL, TRUE, TRUE, 'promoter'
  ),
  (
    'q26a', 'shared', NULL, 5, 2,
    'How do you expect to use what you learned back at work in the next 30–60 days?',
    NULL,
    'open_text',
    '{"placeholder": "A specific thing you''ll put to work soon.", "max_length": 1500}'::jsonb,
    NULL, TRUE, TRUE, 'promoter'
  ),
  (
    'q27a', 'shared', NULL, 5, 3,
    'Would you be willing to have your feedback shared publicly?',
    'Select any that apply. You can always revise this later by emailing us.',
    'multi_enum',
    $json${
      "choices": [
        {"id": "name_title_company", "label": "Yes, with my name, title, and company"},
        {"id": "name_title",          "label": "Yes, with my name and title only"},
        {"id": "anonymous",           "label": "Yes, but anonymously (e.g., \"HR Director, Fortune 500 manufacturer\")"},
        {"id": "internal_only",       "label": "I'd prefer to keep my feedback internal only",     "exclusive": true},
        {"id": "video_testimonial",   "label": "I'd be open to a short video testimonial — please reach out"}
      ]
    }$json$::jsonb,
    NULL, TRUE, FALSE, 'promoter'
  ),

  -- ========= Detractor branch =========
  (
    'q25b', 'shared', NULL, 5, 1,
    'What would have made this program significantly better for you?',
    'Be as direct as you want — this is the most useful feedback we can get.',
    'open_text',
    '{"placeholder": "Specifics are what help us improve.", "max_length": 2500}'::jsonb,
    NULL, TRUE, TRUE, 'detractor'
  ),
  (
    'q26b', 'shared', NULL, 5, 2,
    'Is there anything we could do to address your concerns directly?',
    NULL,
    'enum',
    '{"choices": ["Yes, please reach out", "No, just wanted to share feedback"]}'::jsonb,
    NULL, TRUE, FALSE, 'detractor'
  ),

  -- ========= Everyone (branch = NULL) =========
  (
    'q28', 'shared', NULL, 5, 10,
    'If you could change one thing about this program, what would it be?',
    NULL,
    'open_text',
    '{"placeholder": "One change that would make the biggest difference.", "max_length": 2000}'::jsonb,
    NULL, TRUE, TRUE, NULL
  ),
  (
    'q29', 'shared', NULL, 5, 11,
    'What almost stopped you from attending this program?',
    NULL,
    'open_text',
    '{"placeholder": "What nearly killed the registration — cost, timing, skepticism, anything.", "max_length": 2000}'::jsonb,
    NULL, TRUE, TRUE, NULL
  ),
  (
    'q30', 'shared', NULL, 5, 12,
    'How did you first hear about IAML or this program?',
    NULL,
    'enum',
    $json${
      "choices": [
        "Employer recommended",
        "Colleague referral",
        "Past IAML attendee",
        "Google search",
        "LinkedIn",
        "Email from IAML",
        "Law firm partner recommended",
        "Other"
      ]
    }$json$::jsonb,
    NULL, TRUE, FALSE, NULL
  ),
  (
    'q31', 'shared', NULL, 5, 13,
    'Anything else you''d like us to know?',
    'Optional.',
    'open_text',
    '{"placeholder": "Optional — anything the rest of the survey missed.", "max_length": 3000}'::jsonb,
    NULL, FALSE, TRUE, NULL
  )
ON CONFLICT (question_id) DO NOTHING;
