import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const read = path => readFile(path, "utf8");
const [owner, css, shoot, matrix] = await Promise.all([
  read("smart_target_workspace.js"),
  read("smart_target_workspace.css"),
  read("shoot.html"),
  read("matrix.html")
]);
const [records, secV1, talkingDemoFixture, vaultCss] = await Promise.all([
  read("records.html"),
  read("sec_v1.js"),
  read("baker_talking_demo_session.js"),
  read("ballistic-vault.css")
]);
const selfTeachingPlayer = await read("self_teaching_player.js");
const platformContracts = await read("platform_contracts.js");
const narrationAssets = await Promise.all([
  "baker-selected.wav",
  "baker-photo-after-shooting.wav",
  "baker-aim-intro.wav",
  "baker-aim-explain.wav",
  "baker-shot-group.wav",
  "baker-show-results.wav",
  "baker-add-photo-ready.wav",
  "baker-group-center.wav",
  "baker-vector.wav",
  "baker-adjustment-explain.wav",
  "baker-adjustment-act.wav",
  "baker-begin-confirmation.wav",
  "baker-confirmation-explain.wav",
  "baker-show-confirmation-results.wav",
  "baker-save-session.wav",
  "baker-equipment-photo.wav",
  "baker-save-own-photo.wav",
  "baker-demo-complete.wav",
  "baker-demo-next.wav"
  ,"baker-sec-explain.wav"
  ,"baker-sec-equipment-bridge.wav"
  ,"baker-equipment-library-bridge.wav"
  ,"baker-vault-explain.wav"
  ,"baker-demo-return.wav"
  ,"baker-replenishment.wav"
].map(asset => stat(`assets/audio/episode59/${asset}`)));

assert.match(owner, /function createPrecisionTap\(/, "shared workspace owns Precision Tap interaction");
assert.match(owner, /pointers\.size >= 2/, "shared owner supports two-pointer pinch");
assert.match(owner, /fitScale \* 12/, "shared owner supports useful magnification");
assert.match(owner, /singleStart\.moved/, "pan and tap are distinguished");
assert.match(owner, /onTap\(event, current\)/, "shared owner emits observations without interpreting them");
assert.doesNotMatch(owner, /enabled = !reviewing/, "Review preserves pinch and pan while canTap blocks new observations");
for (const forbidden of [/score/i, /qualif/i, /zeroing/i, /targetProfileId/i, /SKU/i]) {
  assert.doesNotMatch(owner, forbidden, `Precision Tap owner remains mission and target neutral: ${forbidden}`);
}

assert.match(shoot, /for="targetCameraInput">Take Photo<\/label>/);
assert.match(shoot, /for="targetImageInput">Choose Existing Photo<\/label>/);
assert.match(shoot, /id="targetCameraInput" type="file" accept="image\/\*" capture="environment"/);
assert.match(shoot, /SCZN3SmartTargetWorkspace\.createPrecisionTap\(/);
assert.match(shoot, /if \(markMode === "aim" \|\| !currentAimPoint\)/, "first required observation is aim");
assert.match(shoot, /currentImpactPoints\.push\(point\)/, "subsequent observations remain an unbounded shooter-declared collection");
assert.match(shoot, /precisionTapReviewing = true/);
assert.match(shoot, /precisionTapController\?\.setReviewing\(true\)/);
assert.match(shoot, /zeroingLivePhase = "confirmation";\s+precisionTapReviewing = false;/, "a new confirmation group reopens observation entry");
assert.match(shoot, /precisionTapEvidence: precisionTapEvidenceEnvelope\(\)/);
assert.match(shoot, /schemaVersion: "sczn3-precision-tap-observations-v1"/);
assert.match(shoot, /observationAuthority: "shooter_declared"/);
assert.match(shoot, /coordinateConvention: "normalized_source_image_top_left"/);
assert.match(shoot, /sourceImageSha256/);
assert.match(shoot, /originalSourceImageSha256/);
assert.match(shoot, /function governedPrecisionTapRegistration\(/);
assert.match(shoot, /function precisionTapShooterEvidenceReady\(evidence = activeEvidence\(\)\)/);
assert.match(shoot, /function precisionTapControlState\(rangeState, hasEvidence\)/);
assert.match(shoot, /dataset\.precisionTapControlState = precisionTapControlState/);
assert.match(shoot, /function renderPrecisionTapControls\(controlState, rangeState\)/);
assert.match(shoot, /id="precisionTapControlShellContent" data-precision-tap-control-owner="true"/, "one persistent child owns every Precision Tap control state");
assert.doesNotMatch(
  shoot.match(/function handleTargetImageSelection\(event\) \{[\s\S]*?\n\}/)?.[0] || "",
  /resetWorkspaceStageGeometry\(\)/,
  "photo selection replaces evidence without resetting the stay-on-screen workspace"
);
assert.match(shoot, /control\.hidden = !isVisible/);
assert.match(shoot, /control\.style\.setProperty\("display", "none", "important"\)/);
assert.match(shoot, /dataset\.precisionTapHasShots = currentImpactPoints\.length/);
assert.match(shoot, /function registeredExactAssetForUpload\(/);
assert.match(shoot, /imageEvidence\.sha256 !== authority\.sha256/);
assert.match(shoot, /imageEvidence\.width\) !== authority\.widthPx/);
assert.match(shoot, /TARGET_IMAGE_REGISTRATION_ENDPOINT[\s\S]*\/api\/authority\/target-image-registration/);
assert.match(shoot, /function activeTargetImageRegistrationAuthority\(/, "registration is inherited from governed Target Profile data");
assert.match(shoot, /\["exact", "estimated", "partial", "complete"\]\.includes\(String\(evidence\.registrationStatus/, "descriptive governed registration states replace the old binary gate");
assert.match(shoot, /registrationGlobalUncertaintyPx/);
assert.match(shoot, /registrationEvidenceId/);
assert.match(shoot, /registrationReason === "target_identity_unverified"[\s\S]*could not verify that this photo matches the target selected for this session[\s\S]*position and orientation from the photo/, "registration recovery describes identity and orientation failures instead of always asking for more target");
assert.ok(
  shoot.indexOf("const registrationMessage = precisionTapRegistrationMessage()") < shoot.indexOf("const unavailableCapabilityMessage = unavailableResultCapabilityMessage()"),
  "registration fails closed before mission result authority is requested"
);
assert.match(shoot, /precision-tap-marker/);
assert.match(shoot, /precision-tap-aim-marker/);

assert.match(css, /\.precision-tap-viewport\{/);
assert.match(css, /touch-action:none/);
assert.match(css, /--precision-tap-marker-size,18px/);
assert.match(css, /background:rgba\(255,255,255,\.08\)/, "precision marker leaves the physical hole visible");
assert.match(css, /precision-tap-control-shell-content > \[hidden\][\s\S]*display:none!important/, "inactive workflow controls are removed from the active shell");
assert.match(shoot, /Tap Your Aim Point/);
assert.match(shoot, /Tap Your Shots/);
assert.match(shoot, /nextStep = "setAimMode"/);
assert.match(shoot, /nextStep = "addImpactMode"/);
assert.match(shoot, /function governedCorrectionVector\(authorityPackage\)/);
assert.match(shoot, /return \{ start: poib, end: aim, intent: "POIB_TO_AIM" \}/);
assert.match(shoot, /vectorHtmlFromBackend\(governedCorrectionVector\(authorityPackage\)\)/);
assert.doesNotMatch(shoot, /arrowSvg\.style\.width = `\$\{layerRect\.width\}px`/);
assert.match(css, /data-sczn3-workspace-layout="stage-overlay"/);
assert.match(css, /data-sczn3-workspace-actions="true"[\s\S]*position:absolute/, "bottom action region stays anchored to the target workspace");
assert.match(css, /data-precision-tap-control-state="photo_entry"/);
assert.match(css, /data-precision-tap-control-state="aim_entry"/);
assert.match(css, /data-precision-tap-control-state="shot_entry"/);
assert.match(css, /data-precision-tap-control-state="result"/);
assert.match(css, /data-precision-tap-control-state="confirmation_entry"/);
assert.match(css, /data-precision-tap-control-state="save"/);
assert.match(css, /precision-tap-control-shell-content > \[hidden\][\s\S]*display:none!important/);
assert.match(css, /\.precision-tap-control-shell-content\{[\s\S]*width:100%;[\s\S]*height:100%/, "persistent state owner has invariant shell geometry");
assert.match(css, /\.precision-tap-photo-picker\{[\s\S]*height:100%;[\s\S]*background:transparent/, "photo-source choices replace shell contents without adding a panel");
assert.match(css, /precision-tap-photo-picker>div\{[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/, "photo choices share one row in the persistent shell");
assert.match(css, /Defect #8[\s\S]*precision-tap-control-shell-content[\s\S]*border:0!important;[\s\S]*background:transparent!important;[\s\S]*box-shadow:none!important;/, "the workflow row remains the only painted visual shell");
assert.match(shoot, /function isBakerSampleEvidence\(/, "Baker reference evidence is identified as a non-recording SAMPLE stage");
assert.match(shoot, /if \(isBakerSampleEvidence\(activeEvidence\(\)\)\) return;/, "SAMPLE target taps cannot create shooter observations");
assert.match(shoot, /<strong>LET THE TARGET TALK<\/strong>/, "SAMPLE demonstration is repeatable from the waiting target");
assert.match(shoot, /data-sczn3-live-control="target-talk"/, "LET THE TARGET TALK is the single live demonstration control");
assert.match(shoot, /aria-label="Let the target talk\. Start sample demonstration\."/, "the live control states its action accessibly");
assert.match(shoot, /\["pointerdown", "pointerup", "pointercancel"\][\s\S]*event\.stopPropagation\(\)/, "the live control owns its pointer gesture instead of surrendering it to Precision Tap");
assert.doesNotMatch(shoot, /baker-sample-demo-waiting/, "the SAMPLE target is not covered by a permanent instruction panel");
assert.match(shoot, /if \(isBakerSampleEvidence\(\)\) return "";/, "the redundant permanent SAMPLE sequence bar is removed");
assert.match(shoot, /function sampleFeatureHighlightMarkup\(/, "instructional target-feature emphasis is reusable overlay behavior");
assert.match(shoot, /data-sample-feature="\$\{feature\}"/, "the active target feature is identified by reusable overlay data");
assert.match(shoot, /if \(state === "aim"\)[\s\S]*sampleFeatureHighlightMarkup\("aim", 50, 56\.6\)/, "AIM activates the target crosshair highlight");
assert.match(shoot, /if \(state === "add-photo"\)[\s\S]*baker-sample-camera-cue/, "ADD PHOTO receives its own camera-cue turn");
assert.ok(narrationAssets.every(asset => asset.size > 20000), "the exact Founder narration is bundled as audible browser media");
assert.match(shoot, /self_teaching_player\.js/, "the target inherits the universal self-teaching player");
assert.match(selfTeachingPlayer, /class SelfTeachingPlayer/, "player lifecycle is target-neutral reusable behavior");
assert.match(selfTeachingPlayer, /play\(\)[\s\S]*pause\(\)[\s\S]*resume\(\)[\s\S]*restart\(\)[\s\S]*rewind\(/, "the universal player owns play, pause, resume, restart, and logical rewind");
assert.match(selfTeachingPlayer, /this\.logicalElapsedMs[\s\S]*this\.stepHistory/, "rewind is governed by the lesson timeline and logical checkpoints");
assert.match(selfTeachingPlayer, /this\.audio\.onended = finish/, "the next visual turn waits for audible media to finish");
assert.match(selfTeachingPlayer, /this\.audio\.play\(\)[\s\S]*\.catch/, "browser playback failure has a safe sequencing fallback");
assert.match(selfTeachingPlayer, /this\.timer\.pause\(\)/, "PAUSE freezes the active choreography timer");
assert.match(shoot, /self_teaching_player\.js\?v=episode59-founder-player-lock-1/, "the Founder-locked PLAYER vocabulary is cache-busted into the served shooter path");
assert.match(shoot, /smart_target_workspace\.css\?v=episode59-player-continuity-3/, "the corrected PLAYER/action and platform-surface layout is cache-busted into the served shooter path");
assert.match(selfTeachingPlayer, /this\.audio && !this\.audio\.paused[\s\S]*this\.audio\.pause\(\)/, "PAUSE freezes bundled narration");
assert.match(selfTeachingPlayer, /renderReset:|this\.renderReset\(\)/, "RESTART and rewind restore demo-only presentation coherently");
assert.match(selfTeachingPlayer, /action-highlight[\s\S]*is-demonstrated-tap/, "the universal player owns reusable shooter-action emphasis and tap choreography");
assert.match(shoot, /onNarrationStatus: status => \{ document\.body\.dataset\.bakerSampleNarration = status; \}/, "browser-confirmed audible playback remains externally testable");
assert.match(shoot, /const SMART_TARGET_TALK_CHOREOGRAPHY = Object\.freeze\(/, "talk timing is governed by reusable choreography settings");
assert.match(shoot, /heartbeatPeriodMs: 1000/, "the AIM highlight uses a visible one-second heartbeat");
assert.match(shoot, /cadenceMs: 850/, "sample impacts arrive at a deliberate reusable cadence");
assert.match(shoot, /confirmationCadenceMs: 850/, "confirmation impacts use the same deliberate cadence as the initial group");
assert.match(shoot, /completedConfirmationHoldMs: 1800/, "the completed confirmation group remains visible long enough to inspect");
assert.match(shoot, /completedGroupHoldMs: 1800/, "the complete sample group remains visible long enough to inspect");
assert.match(shoot, /resultTeaching: Object\.freeze\(/, "group center, vector, and adjustment use reusable choreography settings");
assert.match(shoot, /vectorDrawMs: 520/, "the vector uses a tightened local draw time");
assert.match(shoot, /state: "intro", narration: "You have selected the Baker 100 Yard Smart Target\."/, "the target confirms the shooter's selection");
assert.doesNotMatch(shoot, /state: "publisher"|smartTargetPublisherRecognitionMarkup/, "the separate early Baker recognition turn is removed without replacement");
assert.match(records, /YOUR SHOOTING SESSION\. PRESERVED\./, "the actual SEC teaches the universal preserved-session memory association");
assert.match(records, /Target • Initial Group • Confirmation Group • Results/, "the SEC reinforcement names the preserved session evidence concisely");
assert.match(records, /YOUR RANGE HISTORY\. SAVED\./, "the actual Vault teaches the universal range-history memory association");
assert.match(records, /Your shooting sessions\. Ready when you want them\./, "the Vault reinforcement explains exact future usefulness without paragraph copy");
assert.doesNotMatch(records, /TARGET BY BAKER TARGETS/, "Baker publisher recognition does not leak into the universal SEC/Vault teaching surface");
assert.match(shoot, /function smartTargetReplenishmentMarkup\(\.\.\.identitySources\)/, "replenishment is a reusable publisher/product relationship instead of a Baker branch");
assert.match(shoot, /SCZN3TargetProfiles\.identityRecord\(\.\.\.identitySources\)/, "replenishment resolves the registered originating target identity");
assert.match(shoot, /const governedRoute = \(product && product\.productUrl\) \|\| \(publisher && publisher\.publisherUrl\);/, "replenishment prefers governed exact-product routing with a publisher fallback");
assert.match(shoot, /if \(!publisher \|\| !governedRoute\) return "";/, "replenishment fails closed when governed product and publisher routing are unavailable");
assert.match(platformContracts, /productId: "ST-100YD-SMART"[\s\S]*?productUrl: "https:\/\/bakertargets\.com\/product\/100-yard-bulls-eye-rifle-target-smart-target-version\/"/, "the registered Baker 100 identity carries its exact governed replenishment destination");
assert.match(shoot, /platform_contracts\.js\?v=episode59-baker-product-route-1/, "the served Baker road cache-busts the governed exact-product route contract");
assert.match(shoot, /BUY MORE TARGETS LIKE THIS/, "the completed demonstration presents the approved replenishment invitation");
assert.match(shoot, /smartTargetReplenishmentMarkup\(bakerTalkingDemoSession\(\)\)/, "the Baker proof supplies session identity to the reusable replenishment surface");
assert.doesNotMatch(shoot.match(/function smartTargetReplenishmentMarkup[\s\S]*?\n\}/)?.[0] || "", /Baker/, "the universal replenishment renderer contains no Baker-coded identity");
assert.match(shoot, /state: "complete", narration: "You can also buy more targets like this directly from Baker Targets\."[\s\S]*preserveScene: true[\s\S]*after: SMART_TARGET_TALK_CHOREOGRAPHY\.replenishmentHoldMs/, "the final replenishment card is already visible for Baker's one spoken commercial moment");
assert.match(shoot, /replenishmentHoldMs: 4200/, "the final Baker replenishment receives a deliberate post-speech viewing hold");
assert.match(shoot, /visualLeadMs: 900/, "shot demonstrations begin after a short spoken lead-in rather than racing the narration");
assert.match(shoot, /After you're finished shooting this target, add a photo of your target\./, "the opening explains the real-photo handoff");
assert.match(shoot, /state: "aim", narration: "We'll start with your aim point\."/, "AIM opens conversationally");
assert.match(shoot, /The crosshairs should be where you aimed\. Tap the spot you aimed at\./, "AIM explains the highlighted feature and shooter action");
assert.match(shoot, /state: "shoot-observations", narration: "Now you'll tap each bullet hole so Tap-n-Score can measure your group\."/, "sample holes arrive while their purpose is spoken");
assert.match(shoot, /state: "add-photo", narration: "Tap Add Photo when you're ready\."/, "ADD PHOTO ends with the direct handoff");
assert.match(shoot, /state: "group-center", narration: "Tap-n-Score then calculates the center of your shot group\."/, "GROUP pronunciation uses a sentence boundary that preserves the final consonant");
assert.match(shoot, /state: "show-results"[\s\S]*selector: "#showResults"[\s\S]*label: "Show Results"/, "the player teaches and demonstrates the actual initial SHOW RESULTS control");
assert.match(shoot, /state: "vector", narration: "The green arrow shows the measured movement from the center of your group to your aim point\."/, "the target teaches the green vector while it draws");
assert.match(shoot, /suggested scope or sight clicks needed to move that center to your aim point/, "adjustment narration explains how the vector becomes mechanical correction");
assert.match(shoot, /three to five confirmation shots/, "confirmation narration preserves the Founder shot-count guidance");
assert.match(shoot, /state: "begin-confirmation"[\s\S]*selector: "#saveMarks"[\s\S]*label: "Begin Confirmation"/, "the player teaches and demonstrates the actual BEGIN CONFIRMATION control");
assert.match(shoot, /state: "show-confirmation-results"[\s\S]*selector: "#showResults"/, "the player demonstrates the required confirmation SHOW RESULTS action");
assert.match(shoot, /state: "save"[\s\S]*selector: "#saveMarks"[\s\S]*label: "Save Session"/, "the player teaches and demonstrates the actual SAVE SESSION control");
assert.match(shoot, /This is your Shooter Experience Card\. It preserves the results from the shooting session you just completed\./, "the real SEC turn explains the preserved session");
assert.match(shoot, /state: "sec", narration: "Your Shooter Experience Card can also preserve the equipment you used for this session\."/, "the Equipment Library bridge begins on the actual SEC");
assert.match(shoot, /state: "equipment-detail", narration: "Your firearms, sights, and other equipment are managed in your Equipment Library\."[\s\S]*waitForSurface: true[\s\S]*after: SMART_TARGET_TALK_CHOREOGRAPHY\.equipmentLibraryHoldMs/, "the Equipment Library bridge now reveals the useful populated Equipment Profile directly");
assert.match(shoot, /equipmentLibraryHoldMs: 5500/, "the populated Equipment Profile receives five to six useful seconds of initial inspection time");
assert.match(shoot, /state: "equipment-detail", narration: "And you can save a picture of your weapon in the Equipment Library as well\."[\s\S]*preserveScene: true[\s\S]*after: SMART_TARGET_TALK_CHOREOGRAPHY\.equipmentDetailHoldMs/, "the same actual saved profile explains its firearm photo without reloading or substituting the surface");
assert.match(shoot, /waitForBakerSampleDemoSurface/, "real component loading time does not consume the viewing hold");
assert.match(shoot, /state: "sec"[\s\S]*state: "equipment-detail"[\s\S]*state: "vault"/, "the visual bridge advances directly from the SEC through the populated equipment profile into Vault");
assert.doesNotMatch(shoot, /\{ state: "equipment-library", narration:/, "the redundant problematic Library-list turn is no longer part of the Talking Smart Target road");
assert.doesNotMatch(shoot, /state: "equipment-detail"[\s\S]*?state: "sec"[\s\S]*?state: "vault"/, "the choreography does not repeat the SEC between Equipment Profile and Vault");
assert.match(shoot, /src="matrix\.html\?\$\{query\}"/, "the talking target embeds the actual Equipment Library instead of a substitute");
assert.match(matrix, /TALKING_TARGET_DEMO_MODE[\s\S]*sessionStorage\.getItem\(TALKING_TARGET_DEMO_EQUIPMENT_STORAGE_KEY\)/, "the real Equipment Library reads an isolated simulation profile without touching shooter data");
assert.match(matrix, /if \(TALKING_TARGET_DEMO_MODE\) return;/, "the isolated Equipment Library flash cannot change the shooter's active equipment");
assert.match(matrix, /profileKicker\.textContent = "Saved equipment"/, "the actual profile editor identifies the demonstrated record as saved equipment");
assert.match(talkingDemoFixture, /equipmentProfiles = Object\.freeze\(\[/, "the actual Equipment Library receives an isolated populated profile collection");
assert.ok((talkingDemoFixture.match(/setupId: "sczn3-talking-demo-equipment-profile-v/g) || []).length >= 3, "the populated preview contains multiple reusable equipment profiles");
assert.match(talkingDemoFixture, /weaponPhoto: Object\.freeze\(\{[\s\S]*dataUrl: "assets\/landing-package-hero-rifle\.png"[\s\S]*source: "talking_target_demo_fixture"/, "the isolated demo profile carries the existing firearm photo fixture");
assert.equal((talkingDemoFixture.match(/weaponPhoto: Object\.freeze\(/g) || []).length, 1, "the firearm photo is attached only to the intended demo profile");
assert.match(matrix, /weaponSightConfiguration\(setup\)/, "the real Equipment Library card presents saved sight configuration");
assert.match(shoot, /this session is now saved in your Ballistic Vault, where you can open it again whenever you need it\./, "the real Vault turn explains exact reopen");
assert.equal((shoot.match(/You have now completed the Tap-n-Score shooting demo\./g) || []).length, 1, "the demonstration declares completion exactly once");
assert.match(shoot, /You can load your actual target and complete the Tap-n-Score process yourself, or replay the demo again\./, "the sole completion returns both real-target and replay choices");
assert.doesNotMatch(shoot, /audio: "assets\/audio\/episode59\/baker-demo-complete\.wav"/, "the duplicate early completion narration is not part of the sequence");
assert.match(css, /\.baker-sample-records-frame,[\s\S]*\.baker-sample-equipment-frame\{[\s\S]*width:166\.6667%;[\s\S]*height:166\.6667%;[\s\S]*transform:scale\(\.6\)/, "the actual SEC, Equipment Library, and Vault are enlarged twenty percent without substitution");
assert.match(css, /\.self-teaching-player-controls\{/, "the universal player controls remain visually quiet and separate from Baker content");
assert.match(css, /\.self-teaching-player-action-highlight\{[\s\S]*self-teaching-action-invite/, "required shooter actions receive reusable tasteful emphasis");
assert.match(css, /\.baker-sample-demo-layer\{[\s\S]*z-index:26;/, "the talking-target layer remains above evidence overlays");
assert.match(shoot, /id="targetEvidencePreview"[\s\S]*id="smartTargetPlayerHost" data-player-owner="workspace-stage"/, "the universal PLAYER host is owned by the stable workspace parent outside the replaceable evidence preview");
assert.match(shoot, /if \(!bakerSampleDemoPlayer\) \{[\s\S]*root,[\s\S]*bakerSampleDemoPlayer\.bindControls\(controls\);/, "evidence rerenders reuse one parent-owned PLAYER instead of constructing a new idle player");
assert.match(shoot, /setBakerSampleDemoState\(bakerSampleDemoPlayer\.status === "idle" \? "waiting" : bakerSampleDemoState\)/, "a rebuilt target surface resumes the active teaching scene without resetting PLAYER continuity");
assert.match(css, /\.self-teaching-player-host\{[\s\S]*z-index:40;[\s\S]*pointer-events:none;/, "the persistent PLAYER host remains above replaceable target and component surfaces without blocking them");
assert.match(css, /\.self-teaching-player-controls\{[\s\S]*bottom:calc\(2\.2% \+ clamp\(50px, 5\.5vw, 62px\) \+ 8px\);/, "PLAYER occupies a dedicated lane above the persistent live-session action row");
assert.match(css, /@media\(max-width:560px\)[\s\S]*\.self-teaching-player-controls\{right:2%;bottom:calc\(2% \+ 54px \+ 8px\);left:2%/, "390px preserves the same separate PLAYER and live-action lanes");
assert.match(css, /data-smart-target-demo-state="equipment-detail"\] \.self-teaching-player-host \.self-teaching-player-controls,[\s\S]*data-smart-target-demo-state="vault"\] \.self-teaching-player-host \.self-teaching-player-controls\{[\s\S]*top:10px;[\s\S]*bottom:auto;[\s\S]*width:min\(60%,520px\)/, "PLAYER remains identifiable and accessible in a dedicated top lane while real platform components are shown");
assert.match(css, /data-smart-target-demo-state="sec"\] > \[data-sczn3-workspace-actions="true"\],[\s\S]*data-smart-target-demo-state="equipment-detail"\] > \[data-sczn3-workspace-actions="true"\],[\s\S]*data-smart-target-demo-state="vault"\] > \[data-sczn3-workspace-actions="true"\][\s\S]*display:none!important;/, "real-session ADD PHOTO and action controls cannot leak across demonstrated platform surfaces");
assert.match(css, /data-demo-state="equipment-detail"\] \.baker-sample-equipment-frame,[\s\S]*data-demo-state="vault"\] \.baker-sample-records-frame\{[\s\S]*top:70px;[\s\S]*height:calc\(166\.6667% - 117px\)/, "component surfaces reserve their own visible area without shrinking their content scale");
assert.match(css, /@media\(max-width:560px\)[\s\S]*data-smart-target-demo-state="equipment-detail"\] \.self-teaching-player-host \.self-teaching-player-controls,[\s\S]*top:27px;right:2%;left:2%;width:auto/, "390px receives the same persistent PLAYER shell without hiding the component");
assert.match(css, /\.smart-target-completion-layout\{[\s\S]*grid-template-columns:minmax\(0,1\.12fr\) minmax\(250px,\.88fr\)/, "completion and replenishment occupy one non-overlapping terminal layout");
assert.match(shoot, /if \(state === "show-results"\) return `<div class="baker-sample-demo-callout is-action-guidance"/, "initial result teaching uses temporary action guidance");
assert.match(shoot, /if \(state === "begin-confirmation"\) return `<div class="baker-sample-demo-callout is-action-guidance"/, "confirmation teaching uses temporary action guidance");
assert.match(shoot, /if \(state === "show-confirmation-results"\) return `<div class="baker-sample-demo-callout is-action-guidance"/, "confirmation result teaching uses temporary action guidance");
assert.match(shoot, /if \(state === "save"\) return `<div class="baker-sample-demo-callout is-action-guidance"/, "save teaching uses temporary action guidance");
assert.match(css, /\.baker-sample-demo-callout\.is-action-guidance\{[\s\S]*background:linear-gradient\(145deg,#f6d05a/, "action teaching uses the temporary gold guidance treatment");
assert.match(css, /\.workspace-stage-shell\.is-player-paused[\s\S]*animation-play-state:paused!important/, "the parent-owned PAUSE state freezes the replaceable target choreography beneath it");
assert.match(css, /\.baker-sample-equipment-frame\{[\s\S]*pointer-events:auto;[\s\S]*touch-action:pan-x pan-y/, "real component surfaces preserve mouse, trackpad, and finger inspection");
assert.match(shoot, /state: "intro"[\s\S]*state: "add-photo"[\s\S]*state: "aim"[\s\S]*state: "shoot-observations"[\s\S]*state: "show-results"[\s\S]*state: "group-center"[\s\S]*state: "vector"[\s\S]*state: "results"[\s\S]*state: "begin-confirmation"[\s\S]*state: "confirmation"[\s\S]*state: "show-confirmation-results"[\s\S]*state: "save"[\s\S]*state: "sec"[\s\S]*state: "vault"[\s\S]*state: "complete"[\s\S]*state: "waiting"/, "the complete Founder teaching sequence demonstrates required taps and returns to the clean waiting target");
assert.match(shoot, /if \(!sessionSaved\) return "Apply your clicks, then shoot your confirmation shots\.";/, "approved correction guidance is preserved");
assert.match(shoot, />Begin Confirmation</, "confirmation action uses the approved concise label");
assert.match(css, /\.baker-sample-watermark/, "SAMPLE evidence is visibly distinguished from shooter evidence");
assert.match(css, /\.baker-sample-watermark\{[\s\S]*width:65%;/, "SAMPLE watermark spans the target working area");
assert.match(css, /\.target-page \.baker-sample-demo-replay\{[\s\S]*background:linear-gradient\(145deg,#f6d05a/, "the live demonstration control remains gold");
assert.match(css, /animation:baker-target-talk-breathe 2\.8s ease-in-out infinite/, "the live control uses restrained ambient illumination");
assert.match(css, /\.target-page \.baker-sample-demo-replay:hover,[\s\S]*transform:translateY\(-2px\)/, "the live control responds to pointer and keyboard focus");
assert.match(css, /\.target-page \.baker-sample-demo-replay:active\{[\s\S]*scale\(\.992\)/, "the live control responds physically to touch");
assert.match(css, /@media\(prefers-reduced-motion:reduce\)[\s\S]*\.target-page \.baker-sample-demo-replay,[\s\S]*animation:none/, "the live treatment respects reduced-motion preference");
assert.match(css, /\.sample-feature-highlight\.is-active\{[\s\S]*animation:sample-feature-heartbeat/, "target-feature emphasis gently pulses only while active");
assert.match(css, /scale\(1\.42\)/, "the AIM heartbeat commands the shooter's eye rather than shimmering");
assert.match(css, /\.baker-sample-poib\{[\s\S]*animation:baker-sample-poib-arrive/, "the group center appears as its own teaching event");
assert.match(css, /\.baker-sample-vector\.is-drawing line\{[\s\S]*animation:baker-sample-vector-draw/, "the vector visibly draws during its narrated turn");
assert.match(css, /stroke:#26ff79;stroke-width:2\.35/, "the vector is bright and heavy enough to read immediately");
assert.match(css, /\.baker-sample-vector\.is-emphasized/, "the vector receives temporary emphasis while narration explains it");
assert.match(css, /\.baker-sample-clicks\.is-emphasized\{[\s\S]*baker-sample-adjustment-breathe/, "mechanical clicks receive emphasis while adjustment is taught");
assert.match(shoot, /marker-end="url\(#bakerSampleVectorArrow\)"/, "the measured vector is presented as a directional arrow");
assert.match(shoot, /baker-sample-measurement/, "authoritative distance and MOA context accompanies the mechanical answer");
assert.match(shoot, /authority\.moa\.windageMOA\.toFixed\(2\)/, "MOA presentation reads the backend-produced fixture rather than recalculating it");
assert.match(shoot, /function bakerTalkingDemoRecordsFrame\(view\)/, "the talking target hands its preserved sample session to the real records surface");
assert.match(shoot, /records\.html\?\$\{query\}/, "the real Universal SEC and Ballistic Vault own the final demonstration stages");
assert.doesNotMatch(shoot, /if \(state === "sec"\) return `<div class="baker-sample-stage-card"/, "the demo does not substitute a mock SEC card");
assert.doesNotMatch(shoot, /if \(state === "vault"\) return `<div class="baker-sample-stage-card"/, "the demo does not substitute a mock Vault card");
assert.match(records, /TALKING_TARGET_DEMO_SESSION_STORAGE_KEY/, "the real records surface accepts the isolated demo artifact");
assert.match(records, /allSavedSessions\.filter\(session => !isSimulationSession\(session\)\)/, "sample sessions cannot contaminate the shooter's normal Vault");
assert.match(talkingDemoFixture, /method: "docs\/backend\/authority_service\.py::build_authority_package"/, "the sample package records its backend authority provenance");
assert.match(talkingDemoFixture, /sourcePackageEvidenceHashes/, "the source backend package hashes remain attached to the preserved fixture provenance");
assert.match(talkingDemoFixture, /windageMOA: 3\.9094, elevationMOA: 7\.3457/, "the sample presents the preserved backend MOA result without browser calculation");
assert.match(talkingDemoFixture, /windageClicks: 16,[\s\S]*elevationClicks: 29/, "the sample presents the preserved backend click result");
assert.match(vaultCss, /body\[data-talking-target-demo-stage="true"\]/, "the actual records surface owns its focused talking-target stage presentation");
assert.match(css, /body\.target-page\[data-baker-sample-stage="true"\] \.workspace-stage-shell \.target-session-context\{display:none!important\}/, "the sample stage removes the redundant permanent guidance bar");
assert.match(css, /\.baker-sample-demo-layer\[data-demo-state="sec"\][\s\S]*\.baker-sample-demo-layer\[data-demo-state="vault"\]/, "SEC and Vault take the stationary stage during the demonstration");
assert.match(records, /missionFamily: "zeroingCorrection",[\s\S]*showSessionScore: false,/, "zeroing SEC does not leak a score into its session header");
assert.match(secV1, /showSessionScore: model\.showSessionScore !== false/, "universal SEC honors an explicit mission-owned score omission");
assert.doesNotMatch(records.match(/const SCZN3Baker100YardSEC = \(\(\) => \{[\s\S]*?\n\}\)\(\);/)?.[0] || "", /SCZN3 cannot confirm this zero yet/, "stale zero-confirmation refusal is removed from Baker SEC");

console.log("PASS Episode 59 Precision Tap production boundary contract");
