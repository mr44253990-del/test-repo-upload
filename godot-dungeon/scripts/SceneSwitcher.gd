extends CanvasLayer
## SceneSwitcher autoload — fade-to-black transitions between scenes.
## Usage: SceneSwitcher.change_scene("res://scenes/MainMenu.tscn")
##
## The fade ColorRect is created entirely in code so this autoload needs no
## .tscn and can never crash on a missing node.

var _fade: ColorRect
var _busy := false


func _ready() -> void:
	layer = 128  # draw on top of everything
	_fade = ColorRect.new()
	_fade.name = "Fade"
	_fade.color = Color(0, 0, 0, 0)
	_fade.anchor_right = 1.0
	_fade.anchor_bottom = 1.0
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	# Keep working even when the SceneTree is paused (e.g. quitting from pause).
	process_mode = Node.PROCESS_MODE_ALWAYS
	add_child(_fade)


func change_scene(path: String, fade_time: float = 0.4) -> void:
	if _busy:
		return
	_busy = true
	var tw := create_tween()
	tw.tween_property(_fade, "color:a", 1.0, fade_time)
	await tw.finished

	var err := get_tree().change_scene_to_file(path)
	if err != OK:
		push_error("SceneSwitcher: failed to load %s (err %d)" % [path, err])

	# Let the new scene's _ready run before fading back in.
	await get_tree().process_frame
	var tw2 := create_tween()
	tw2.tween_property(_fade, "color:a", 0.0, fade_time)
	await tw2.finished
	_busy = false
