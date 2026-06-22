extends Control
## Main menu. Play / Continue / Settings / Credits / Quit, plus a small
## difficulty + seed selector panel.

@onready var _menu: VBoxContainer = $Layout/Left/Menu
@onready var _settings_panel: Control = $SettingsPanel
@onready var _credits_panel: Control = $CreditsPanel
@onready var _play_panel: Control = $PlayPanel
@onready var _version: Label = $Version


func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	_settings_panel.hide()
	_credits_panel.hide()
	_play_panel.hide()
	_version.text = "v1.0.0  •  Godot %s" % Engine.get_version_info().string
	# Subtle entrance animation for the menu buttons.
	for i in _menu.get_child_count():
		var c := _menu.get_child(i) as Control
		c.modulate.a = 0.0
		var tw := create_tween()
		tw.tween_interval(0.05 * i)
		tw.tween_property(c, "modulate:a", 1.0, 0.3)


func _on_play_pressed() -> void:
	Audio.play("click")
	_play_panel.show()


func _on_settings_pressed() -> void:
	Audio.play("click")
	_settings_panel.show()


func _on_credits_pressed() -> void:
	Audio.play("click")
	_credits_panel.show()


func _on_quit_pressed() -> void:
	Audio.play("click")
	get_tree().quit()
