// Pocket Dojo data library ported for Fight-swipe (React Native).
// Houses the move taxonomy and directed edges so gameplay code can stay agnostic.

export type StageId = 1 | 2 | 3 | 4

export type MoveType =
  | "Entry"
  | "Transition"
  | "Sweep"
  | "Pass"
  | "Escape"
  | "Submission"
  | "Control"
  | "Takedown"

export interface BJJNode {
  id: string
  name: string
  type: MoveType
  group: string
  stage: StageId
  aliases: string[]
  prereq: string[]
  notes_md: string
}

export interface BJJEdge {
  from: string
  to: string
  kind: "standard" | "optional"
}

export interface StageRule {
  id: StageId
  name: string
  description: string
  allowedTypes: MoveType[]
}

export const stages: StageRule[] = [
  {
    id: 1,
    name: "Stage 1 - Standing",
    description: "Both athletes are on their feet. Practice takedowns, trips, and safe guard pulls.",
    allowedTypes: ["Entry", "Transition", "Takedown"],
  },
  {
    id: 2,
    name: "Stage 2 - Guard & Transitional Ground",
    description:
      "Early ground phases. Includes Stage 2A top in guard, Stage 2B bottom guard, Stage 2B+ bad spots, and Stage 2C scrambles.",
    allowedTypes: ["Control", "Escape", "Transition", "Pass", "Sweep"],
  },
  {
    id: 3,
    name: "Stage 3 - Dominant Control",
    description:
      "Side control, mount, back control, knee-on-belly, or strong leg entanglement. Stabilize to hunt the finish.",
    allowedTypes: ["Control", "Transition", "Submission"],
  },
  {
    id: 4,
    name: "Stage 4 - Submission Finish",
    description: "Terminal finishing mechanics: chokes, upper-body locks, and leg locks.",
    allowedTypes: ["Submission"],
  },
]

export const nodes: BJJNode[] = [
  // ---------- STAGE 1: STANDING ----------
  {
    id: "stage1_double_leg",
    name: "Double Leg Takedown",
    type: "Takedown",
    group: "Stage 1 - Standing",
    stage: 1,
    aliases: ["Double leg"],
    prereq: [],
    notes_md: "Level change, penetration step, connect the hands behind the knees, and drive through to finish safely on top.",
  },
  {
    id: "stage1_body_lock_trip",
    name: "Body Lock Trip",
    type: "Takedown",
    group: "Stage 1 - Standing",
    stage: 1,
    aliases: ["Body lock", "Outside trip"],
    prereq: [],
    notes_md: "Secure a tight body lock, off-balance them, block the leg, and rotate them to the mat.",
  },
  {
    id: "stage1_single_leg_snap",
    name: "Snap Down to Front Headlock",
    type: "Entry",
    group: "Stage 1 - Standing",
    stage: 1,
    aliases: ["Front headlock entry"],
    prereq: [],
    notes_md: "Use a collar tie snap down to force a front headlock and start attacking the neck or angles.",
  },
  {
    id: "stage1_guard_pull_closed",
    name: "Closed Guard Pull",
    type: "Transition",
    group: "Stage 1 - Standing",
    stage: 1,
    aliases: ["Guard pull"],
    prereq: [],
    notes_md: "Sit to the mat under control, maintain grips, and close your guard immediately around the opponent.",
  },
  {
    id: "stage1_arm_drag_to_back",
    name: "Arm Drag to Back Take",
    type: "Transition",
    group: "Stage 1 - Standing",
    stage: 1,
    aliases: ["Arm drag"],
    prereq: [],
    notes_md: "Drag the arm across your body, step to the angle, and move directly to the back.",
  },

  // ---------- STAGE 2A: TOP IN GUARD ----------
  {
    id: "stage2a_posture_break",
    name: "Posture and Guard Break",
    type: "Control",
    group: "Stage 2A - Top in Guard",
    stage: 2,
    aliases: ["Closed guard top posture"],
    prereq: [],
    notes_md: "Build strong posture, control the hips, and use a safe guard break to open the legs.",
  },
  {
    id: "stage2a_knee_slice_pass",
    name: "Knee Slice Pass",
    type: "Pass",
    group: "Stage 2A - Top in Guard",
    stage: 2,
    aliases: ["Knee slide pass"],
    prereq: ["stage2a_posture_break"],
    notes_md: "Underhook the far side, pin their legs, and slice your knee through into side control.",
  },
  {
    id: "stage2a_double_under_pass",
    name: "Double Under Stack Pass",
    type: "Pass",
    group: "Stage 2A - Top in Guard",
    stage: 2,
    aliases: ["Double under pass"],
    prereq: ["stage2a_posture_break"],
    notes_md: "Thread both arms under the legs, stack their hips high, and walk around to side control.",
  },
  {
    id: "stage2a_torreando_pass",
    name: "Torreando Bullfighter Pass",
    type: "Pass",
    group: "Stage 2A - Top in Guard",
    stage: 2,
    aliases: ["Bullfighter pass"],
    prereq: ["stage2a_posture_break"],
    notes_md: "Control the ankles or pants, step laterally, and cut around the legs into side control.",
  },
  {
    id: "stage2a_leg_drag_pass",
    name: "Leg Drag Pass",
    type: "Pass",
    group: "Stage 2A - Top in Guard",
    stage: 2,
    aliases: ["Leg drag"],
    prereq: ["stage2a_posture_break"],
    notes_md: "Drag both legs across your body, staple their hips, and settle into side control or knee-on-belly.",
  },

  // ---------- STAGE 2B: CLOSED GUARD BOTTOM ----------
  {
    id: "stage2b_closed_guard_control",
    name: "Closed Guard Control",
    type: "Control",
    group: "Stage 2B - Bottom Guard",
    stage: 2,
    aliases: ["Closed guard"],
    prereq: [],
    notes_md: "Break their posture, manage grips, and keep your hips active to set up sweeps and submissions.",
  },
  {
    id: "stage2b_hip_bump",
    name: "Hip Bump Sweep",
    type: "Sweep",
    group: "Stage 2B - Bottom Guard",
    stage: 2,
    aliases: ["Hip heist sweep"],
    prereq: ["stage2b_closed_guard_control"],
    notes_md: "Sit up, trap the posting arm, and drive your hips into them to roll into mount.",
  },
  {
    id: "stage2b_scissor_sweep",
    name: "Scissor Sweep",
    type: "Sweep",
    group: "Stage 2B - Bottom Guard",
    stage: 2,
    aliases: ["Classic scissor sweep"],
    prereq: ["stage2b_closed_guard_control"],
    notes_md: "Open the guard to a knee shield, control the sleeve and collar, and chop the legs to tip them into side control.",
  },
  {
    id: "stage2b_flower_sweep",
    name: "Flower Sweep",
    type: "Sweep",
    group: "Stage 2B - Bottom Guard",
    stage: 2,
    aliases: ["Pendulum sweep"],
    prereq: ["stage2b_closed_guard_control"],
    notes_md: "Underhook the far leg, swing it in a big arc, and tilt them into mount.",
  },
  {
    id: "stage2b_kimura_guard",
    name: "Kimura from Closed Guard",
    type: "Submission",
    group: "Stage 2B - Bottom Guard",
    stage: 4,
    aliases: ["Kimura guard"],
    prereq: ["stage2b_closed_guard_control"],
    notes_md: "Control the wrist, sit up to lock the figure-four, then angle off and rotate the shoulder for the tap.",
  },
  {
    id: "stage2b_cross_collar_guard",
    name: "Cross Collar Choke from Guard",
    type: "Submission",
    group: "Stage 2B - Bottom Guard",
    stage: 4,
    aliases: ["X-choke from guard"],
    prereq: ["stage2b_closed_guard_control"],
    notes_md: "Feed a deep cross-collar grip, add the second hand, and pull your elbows to your ribs while keeping their posture broken.",
  },
  {
    id: "stage2b_triangle_choke",
    name: "Triangle Choke from Guard",
    type: "Submission",
    group: "Stage 2B - Bottom Guard",
    stage: 4,
    aliases: ["Triangle from closed"],
    prereq: ["stage2b_closed_guard_control"],
    notes_md: "Control the wrist, shoot your legs into a triangle, adjust the angle, and squeeze with hips and knees.",
  },

  // ---------- STAGE 2B+: BAD SPOTS ----------
  {
    id: "stage2b_bad_half_escape",
    name: "Half Guard Frame Escape",
    type: "Escape",
    group: "Stage 2B+ - Bad Spot",
    stage: 2,
    aliases: ["Half guard bottom escape"],
    prereq: [],
    notes_md: "Frame the crossface, hip escape, and insert your knee shield or recover full guard.",
  },
  {
    id: "stage2b_bad_turtle",
    name: "Turtle Guard Recovery",
    type: "Escape",
    group: "Stage 2B+ - Bad Spot",
    stage: 2,
    aliases: ["Turtle recovery"],
    prereq: [],
    notes_md: "Protect your neck and arms, then roll to guard or build a single-leg from turtle.",
  },

  // ---------- STAGE 2C: SCRAMBLES / WRESTLE-UPS ----------
  {
    id: "stage2c_front_headlock_spin",
    name: "Front Headlock Spin Behind",
    type: "Transition",
    group: "Stage 2C - Scramble",
    stage: 2,
    aliases: ["Spin behind"],
    prereq: [],
    notes_md: "Block their head and arm, sprawl your legs back, and spin to the back or side control.",
  },
  {
    id: "stage2c_wrestle_up_single",
    name: "Wrestle-Up Single Leg",
    type: "Transition",
    group: "Stage 2C - Scramble",
    stage: 2,
    aliases: ["Wrestle-up"],
    prereq: [],
    notes_md: "From a seated or low guard, clamp the leg, come to your feet, and finish the single.",
  },

  // ---------- STAGE 2: OPEN GUARD ----------
  {
    id: "stage2_open_guard_control",
    name: "Open Guard Control",
    type: "Control",
    group: "Stage 2B - Open Guard",
    stage: 2,
    aliases: ["Open guard"],
    prereq: [],
    notes_md: "Use hooks, grips, and hip movement to keep distance and set up sweeps or transitions.",
  },
  {
    id: "stage2_tripod_sweep",
    name: "Tripod Sweep",
    type: "Sweep",
    group: "Stage 2B - Open Guard",
    stage: 2,
    aliases: ["Tripod ankle pick"],
    prereq: ["stage2_open_guard_control"],
    notes_md: "Control one ankle and the opposite collar or sleeve, then kick out the base leg to put them on the mat.",
  },
  {
    id: "stage2_sickle_sweep",
    name: "Sickle Sweep",
    type: "Sweep",
    group: "Stage 2B - Open Guard",
    stage: 2,
    aliases: ["Sickle"],
    prereq: ["stage2_open_guard_control"],
    notes_md: "Use a chopping motion with your leg behind their ankle while controlling grips to knock them backward.",
  },
  {
    id: "stage2_technical_standup",
    name: "Technical Stand-Up",
    type: "Escape",
    group: "Stage 2C - Scramble",
    stage: 2,
    aliases: ["Technical get-up"],
    prereq: ["stage2_open_guard_control"],
    notes_md: "Post on one hand and opposite foot, slide the hips back, and stand up while keeping distance.",
  },

  // ---------- STAGE 2: HALF GUARD ----------
  {
    id: "stage2_half_guard_control",
    name: "Half Guard Control (Bottom)",
    type: "Control",
    group: "Stage 2B - Half Guard",
    stage: 2,
    aliases: ["Half guard bottom"],
    prereq: [],
    notes_md: "Use knee shield or underhook to control distance and stop the crossface.",
  },
  {
    id: "stage2_old_school_sweep",
    name: "Old School Sweep",
    type: "Sweep",
    group: "Stage 2B - Half Guard",
    stage: 2,
    aliases: ["Old school"],
    prereq: ["stage2_half_guard_control"],
    notes_md: "From underhook half guard, trap their foot, drive forward, and come up on top.",
  },
  {
    id: "stage2_half_guard_knee_cut",
    name: "Knee Cut from Half Guard Top",
    type: "Pass",
    group: "Stage 2A - Top in Guard",
    stage: 2,
    aliases: ["Half guard knee cut"],
    prereq: ["stage2a_posture_break"],
    notes_md: "Clear the knee shield, underhook, and slide your knee across their thigh into side control.",
  },

  // ---------- STAGE 3: DOMINANT CONTROL ----------
  {
    id: "stage3_side_control",
    name: "Side Control Pressure",
    type: "Control",
    group: "Stage 3 - Dominant Control",
    stage: 3,
    aliases: ["Side mount"],
    prereq: [],
    notes_md: "Crossface and underhook, heavy hips, and steady chest pressure to pin them flat.",
  },
  {
    id: "stage3_knee_on_belly",
    name: "Knee on Belly",
    type: "Control",
    group: "Stage 3 - Dominant Control",
    stage: 3,
    aliases: ["KOB"],
    prereq: ["stage3_side_control"],
    notes_md: "Slide your knee across their stomach, post the other leg wide, and keep strong grips to control and attack.",
  },
  {
    id: "stage3_mount",
    name: "Mount Control",
    type: "Control",
    group: "Stage 3 - Dominant Control",
    stage: 3,
    aliases: ["Mount"],
    prereq: ["stage3_side_control"],
    notes_md: "Climb high, grapevine or pinch your legs, and isolate arms and head for attacks.",
  },
  {
    id: "stage3_back_control",
    name: "Back Control Seatbelt",
    type: "Control",
    group: "Stage 3 - Dominant Control",
    stage: 3,
    aliases: ["Back mount"],
    prereq: ["stage3_mount"],
    notes_md: "Use seatbelt grips with hooks or body triangle and keep your head close to theirs to control the position.",
  },

  // ---------- STAGE 4: SUBMISSIONS ----------
  {
    id: "stage4_rnc",
    name: "Rear Naked Choke",
    type: "Submission",
    group: "Stage 4 - Choke Finishes",
    stage: 4,
    aliases: ["RNC"],
    prereq: ["stage3_back_control"],
    notes_md: "Slide the choking arm under the chin, grab your biceps, hide the hand, and squeeze with your back and chest.",
  },
  {
    id: "stage4_cross_collar_mount",
    name: "Cross Collar Choke from Mount",
    type: "Submission",
    group: "Stage 4 - Choke Finishes",
    stage: 4,
    aliases: ["X-choke from mount"],
    prereq: ["stage3_mount"],
    notes_md: "Feed one deep collar grip, add the second grip, keep your head low, and pull your elbows to finish.",
  },
  {
    id: "stage4_armbar_mount",
    name: "Armbar from Mount",
    type: "Submission",
    group: "Stage 4 - Upper Body Locks",
    stage: 4,
    aliases: ["Juji gatame mount"],
    prereq: ["stage3_mount"],
    notes_md: "Isolate the arm, step over the head, fall with control, pinch your knees, and extend the hips.",
  },
  {
    id: "stage4_kimura_side",
    name: "Kimura from Side Control",
    type: "Submission",
    group: "Stage 4 - Upper Body Locks",
    stage: 4,
    aliases: ["Side control Kimura"],
    prereq: ["stage3_side_control"],
    notes_md: "Control the far arm, lock the figure-four grip, step over the head if needed, and rotate the shoulder.",
  },
  {
    id: "stage4_bow_and_arrow",
    name: "Bow and Arrow Choke",
    type: "Submission",
    group: "Stage 4 - Choke Finishes",
    stage: 4,
    aliases: ["Bow & arrow"],
    prereq: ["stage3_back_control"],
    notes_md: "Feed the collar, control the far leg, fall to the side, and extend your body like drawing a bow.",
  },
  {
    id: "stage4_straight_ankle",
    name: "Straight Ankle Lock",
    type: "Submission",
    group: "Stage 4 - Leg Locks",
    stage: 4,
    aliases: ["Straight footlock"],
    prereq: ["stage2_open_guard_control"],
    notes_md: "Enter ashi garami, place the blade of your forearm on the Achilles, and drive your hips forward.",
  },
]

export const edges: BJJEdge[] = [
  { from: "stage1_double_leg", to: "stage2a_posture_break", kind: "standard" },
  { from: "stage1_body_lock_trip", to: "stage2a_posture_break", kind: "standard" },
  { from: "stage1_guard_pull_closed", to: "stage2b_closed_guard_control", kind: "standard" },
  { from: "stage1_single_leg_snap", to: "stage2c_front_headlock_spin", kind: "standard" },
  { from: "stage1_arm_drag_to_back", to: "stage3_back_control", kind: "standard" },

  { from: "stage2a_posture_break", to: "stage2a_knee_slice_pass", kind: "standard" },
  { from: "stage2a_posture_break", to: "stage2a_double_under_pass", kind: "optional" },
  { from: "stage2a_posture_break", to: "stage2a_torreando_pass", kind: "optional" },
  { from: "stage2a_posture_break", to: "stage2a_leg_drag_pass", kind: "optional" },

  { from: "stage2a_knee_slice_pass", to: "stage3_side_control", kind: "standard" },
  { from: "stage2a_double_under_pass", to: "stage3_side_control", kind: "standard" },
  { from: "stage2a_torreando_pass", to: "stage3_side_control", kind: "standard" },
  { from: "stage2a_leg_drag_pass", to: "stage3_side_control", kind: "standard" },

  { from: "stage2b_closed_guard_control", to: "stage2b_hip_bump", kind: "standard" },
  { from: "stage2b_closed_guard_control", to: "stage2b_scissor_sweep", kind: "standard" },
  { from: "stage2b_closed_guard_control", to: "stage2b_flower_sweep", kind: "optional" },
  { from: "stage2b_closed_guard_control", to: "stage2b_kimura_guard", kind: "optional" },
  { from: "stage2b_closed_guard_control", to: "stage2b_cross_collar_guard", kind: "optional" },
  { from: "stage2b_closed_guard_control", to: "stage2b_triangle_choke", kind: "optional" },

  { from: "stage2b_hip_bump", to: "stage3_mount", kind: "standard" },
  { from: "stage2b_scissor_sweep", to: "stage3_side_control", kind: "standard" },
  { from: "stage2b_flower_sweep", to: "stage3_mount", kind: "standard" },

  { from: "stage2b_bad_half_escape", to: "stage2_half_guard_control", kind: "standard" },
  { from: "stage2b_bad_half_escape", to: "stage2_open_guard_control", kind: "optional" },
  { from: "stage2b_bad_turtle", to: "stage2c_front_headlock_spin", kind: "optional" },
  { from: "stage2b_bad_turtle", to: "stage2b_closed_guard_control", kind: "optional" },

  { from: "stage2c_front_headlock_spin", to: "stage3_back_control", kind: "standard" },
  { from: "stage2c_front_headlock_spin", to: "stage4_rnc", kind: "optional" },
  { from: "stage2c_wrestle_up_single", to: "stage2a_posture_break", kind: "standard" },
  { from: "stage2c_wrestle_up_single", to: "stage3_side_control", kind: "optional" },
  { from: "stage2_technical_standup", to: "stage1_double_leg", kind: "optional" },

  { from: "stage2_open_guard_control", to: "stage2_tripod_sweep", kind: "standard" },
  { from: "stage2_open_guard_control", to: "stage2_sickle_sweep", kind: "standard" },
  { from: "stage2_tripod_sweep", to: "stage3_side_control", kind: "standard" },
  { from: "stage2_sickle_sweep", to: "stage3_side_control", kind: "standard" },

  { from: "stage2_half_guard_control", to: "stage2_old_school_sweep", kind: "optional" },
  { from: "stage2_old_school_sweep", to: "stage3_side_control", kind: "standard" },
  { from: "stage2_half_guard_knee_cut", to: "stage3_side_control", kind: "standard" },

  { from: "stage3_side_control", to: "stage3_knee_on_belly", kind: "optional" },
  { from: "stage3_side_control", to: "stage3_mount", kind: "optional" },
  { from: "stage3_side_control", to: "stage4_kimura_side", kind: "optional" },

  { from: "stage3_knee_on_belly", to: "stage3_mount", kind: "standard" },
  { from: "stage3_knee_on_belly", to: "stage2b_bad_half_escape", kind: "optional" },

  { from: "stage3_mount", to: "stage4_armbar_mount", kind: "standard" },
  { from: "stage3_mount", to: "stage4_cross_collar_mount", kind: "optional" },

  { from: "stage3_back_control", to: "stage4_rnc", kind: "standard" },
  { from: "stage3_back_control", to: "stage4_bow_and_arrow", kind: "optional" },
]

export const bjjData = {
  version: 4,
  stages,
  nodes,
  edges,
}

// Default export so Expo Router doesn't treat this file as a missing route component.
// It is not meant to render UI.
const BjjDataRoutePlaceholder = () => null
export default BjjDataRoutePlaceholder
