# TSTT Narration Standard

Status: Founder-approved reusable TSTT presentation standard  
Selected instructor voice: Samantha  
Baseline delivery: rate approximately `0.70`, neutral pitch

This standard governs how approved lesson meaning is spoken. It does not create, broaden, or replace Target Authority, Equipment Authority, or lesson content.

## Instruction pattern

1. Use one thought per sentence. Split explanation, direction, action, and consequence when the shooter would otherwise have to hold several things in memory.
2. Pause briefly after every sentence. Use a longer pause before or after an action that the shooter must perform.
3. Emphasize only the important word or phrase. Typical examples are direction, quantity, control name, and click count.
4. Put the action first when action is required. Follow it with the identifying or explanatory detail.
5. Use one governed name for the same thing throughout the lesson.
6. Slow down around numbers, distances, adjustment values, and directions.
7. Preserve vocal hierarchy: calm explanation, deliberate important fact, crisp action, and slightly warmer completion.
8. Use silence so the shooter can look at the highlighted target feature or equipment control.
9. Speak directly to one shooter in natural language.
10. End completed instructions decisively.
11. Keep visual and audio teaching in the same sequence. A visible instruction must be able to recover a missed spoken phrase.
12. Where applicable, use this rhythm: **say it → pause → let them see it → give the action → pause**. This supports **see it → find it → move it**.

## Runtime expression

- Narration is queued as short sentence-level utterances instead of one chapter-sized speech block.
- Each sentence declares a delivery role: normal, important, action, look, or completion.
- Sentence boundaries create natural silence. Action and observation roles receive longer silence.
- Important and action sentences run slightly slower than the `0.70` baseline. Pitch remains neutral.
- Pronunciation preparation expands governed abbreviations and numerical values before they reach the browser voice engine.
- Samantha is the first-choice U.S. English voice. Other neutral U.S. English voices are fallbacks only when Samantha is unavailable.

## Browser limitations

The Web Speech API does not guarantee word-level emphasis, exact pause duration, identical voice availability, or identical prosody across Safari and iOS versions. Segmenting speech into sentence-level utterances gives TSTT reliable thought boundaries, but the device voice engine still controls final cadence and timbre. Phone-speaker listening remains a required Founder acceptance test.

## Acceptance

On an ordinary iPhone speaker, a first-time shooter must be able to understand each sentence on first hearing. Technical terms, numbers, and directions must be clear. Pauses must feel natural and leave time to look or act. Narration must support the visible lesson and sound like an instructor—not software reading a paragraph.
