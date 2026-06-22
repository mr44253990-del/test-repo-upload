extends Control
## Loading screen — streams the gameplay scene in the background using
## ResourceLoader.load_threaded_* so the progress bar reflects real progress,
## then swaps to it once ready.

const GAME_SCENE := "res://scenes/Game.tscn"

@onready var _bar: ProgressBar = $Center/VBox/Bar
@onready var _percent: Label = $Center/VBox/Percent
@onready var _tip: Label = $Center/VBox/Tip
@onready var _stage: Label = $Center/VBox/Stage
@onready var _spinner: TextureRect = $Center/VBox/SpinnerHolder/Spinner
@onready var _title: Label = $Title

var _t := 0.0

var _tips := [
	"Tip: Press F to toggle your flashlight.",
	"Tip: Walls you can pass are sometimes hidden — look for cracks.",
	"Tip: Sprint with Shift, but watch your stamina.",
	"Tip: Every maze is generated from a seed. Share a good one!",
	"Tip: Traps blend into the floor. Tread carefully.",
	"Tip: Find all keys to unlock the exit chamber.",
]
var _progress := []
var _done := false


func _ready() -> void:
	_tip.text = _tips[randi() % _tips.size()]
	_stage.text = "Generating labyrinth (seed %d)..." % GameState.maze_seed
	var err := ResourceLoader.load_threaded_request(GAME_SCENE)
	if err != OK:
		_stage.text = "Failed to start loading (err %d)" % err


func _process(delta: float) -> void:
	# Animate spinner + pulsing title regardless of load state.
	_t += delta
	if _spinner:
		_spinner.rotation = _t * 4.0
	if _title:
		_title.modulate.a = 0.7 + 0.3 * sin(_t * 3.0)

	if _done:
		return
	var status := ResourceLoader.load_threaded_get_status(GAME_SCENE, _progress)
	match status:
		ResourceLoader.THREAD_LOAD_IN_PROGRESS:
			var p := 0.0
			if _progress.size() > 0:
				p = float(_progress[0])
			_set_progress(p)
		ResourceLoader.THREAD_LOAD_LOADED:
			_set_progress(1.0)
			_done = true
			_finish()
		ResourceLoader.THREAD_LOAD_FAILED, ResourceLoader.THREAD_LOAD_INVALID_RESOURCE:
			_stage.text = "Load error — returning to menu."
			_done = true
			await get_tree().create_timer(1.5).timeout
			SceneSwitcher.change_scene("res://scenes/MainMenu.tscn")


func _set_progress(p: float) -> void:
	_bar.value = p * 100.0
	_percent.text = "%d%%" % int(p * 100.0)


func _finish() -> void:
	_stage.text = "Entering the maze..."
	await get_tree().create_timer(0.5).timeout
	var packed: PackedScene = ResourceLoader.load_threaded_get(GAME_SCENE)
	get_tree().change_scene_to_packed(packed)
