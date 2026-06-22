extends CanvasLayer
## SceneSwitcher autoload — fade-to-black transitions between scenes.
## Usage: SceneSwitcher.change_scene("res://scenes/MainMenu.tscn")

@onready var _fade: ColorRect = $Fade

var _busy := false


func _ready() -> void:
	layer = 128  # draw on top of everything
	# Build the fade rect in code so this autoload needs no .tscn.
	if not has_node("Fade"):
		var rect := ColorRect.new()
		rect.name = "Fade"
		rect.color = Color(0, 0, 0, 0)
		rect.anchor_right = 1.0
		rect.anchor_bottom = 1.0
		rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
		add_child(rect)
		_fade = rect


func change_scene(path: String, fade_time: float = 0.4) -> void:
	if _busy:
		return
	_busy = true
	var tw := create_tween()
	tw.tween_property(_fade, "color:a", 1.0, fade_time)
	await tw.finished
	get_tree().change_scene_to_file(path)
	# Small wait so the new scene's _ready runs before we fade back in.
	await get_tree().process_frame
	var tw2 := create_tween()
	tw2.tween_property(_fade, "color:a", 0.0, fade_time)
	await tw2.finished
	_busy = false
