extends Control
## Splash / boot screen. Shows the logo, an animated spinner and a fake
## "initializing systems" loading bar, then moves to the main menu.

@onready var _logo: Label = $Center/VBox/Logo
@onready var _subtitle: Label = $Center/VBox/Subtitle
@onready var _spinner: TextureRect = $Center/VBox/SpinnerHolder/Spinner
@onready var _bar: ProgressBar = $Center/VBox/Bar
@onready var _status: Label = $Center/VBox/Status

var _steps := [
	"Initializing render device...",
	"Loading shaders...",
	"Warming up physics...",
	"Building asset cache...",
	"Calibrating audio buses...",
	"Ready.",
]
var _elapsed := 0.0


func _ready() -> void:
	_logo.modulate.a = 0.0
	_subtitle.modulate.a = 0.0
	var intro := create_tween()
	intro.tween_property(_logo, "modulate:a", 1.0, 0.8)
	intro.parallel().tween_property(_logo, "scale", Vector2.ONE, 0.8)\
		.from(Vector2(0.85, 0.85))
	intro.tween_property(_subtitle, "modulate:a", 1.0, 0.5)
	_run_boot()


func _process(delta: float) -> void:
	_elapsed += delta
	_spinner.rotation = _elapsed * 4.0


func _run_boot() -> void:
	var n := _steps.size()
	for i in range(n):
		_status.text = _steps[i]
		var target := float(i + 1) / float(n) * 100.0
		var tw := create_tween()
		tw.tween_property(_bar, "value", target, 0.35)\
			.set_trans(Tween.TRANS_CUBIC)
		await tw.finished
		await get_tree().create_timer(0.15).timeout
	await get_tree().create_timer(0.4).timeout
	SceneSwitcher.change_scene("res://scenes/MainMenu.tscn")


func _unhandled_input(event: InputEvent) -> void:
	# Allow skipping the splash.
	if event is InputEventKey and event.pressed:
		SceneSwitcher.change_scene("res://scenes/MainMenu.tscn")
	elif event is InputEventMouseButton and event.pressed:
		SceneSwitcher.change_scene("res://scenes/MainMenu.tscn")
