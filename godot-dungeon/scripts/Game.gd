extends Node3D
## Gameplay root. Builds the maze, spawns the player, wires up the HUD,
## handles key pickups / traps / the exit, win & lose states, and pausing.

@onready var _player: CharacterBody3D = $Player
@onready var _hud: Control = $HUD
@onready var _key_label: Label = $HUD/Top/KeyLabel
@onready var _timer_label: Label = $HUD/Top/TimerLabel
@onready var _stamina_bar: ProgressBar = $HUD/Bottom/StaminaBar
@onready var _message: Label = $HUD/Center/Message
@onready var _pause_menu: Control = $HUD/PauseMenu
@onready var _settings_panel: Control = $HUD/PauseSettings
@onready var _crosshair: Control = $HUD/Crosshair

var _builder: MazeBuilder
var _won := false
var _spin_t := 0.0
var _keys_node_positions: Array[Node3D] = []


func _ready() -> void:
	_build_world()
	_player.stamina_changed.connect(_on_stamina_changed)
	_pause_menu.hide()
	_settings_panel.hide()
	_update_key_label()
	_show_message("Find %d keys, then reach the green portal." % GameState.total_keys, 4.0)


func _build_world() -> void:
	var diff_keys := [3, 5, 8][GameState.difficulty]
	var diff_traps := [4, 8, 14][GameState.difficulty]
	var rooms := max(3, GameState.maze_size / 3)

	var gen := MazeGenerator.new(GameState.maze_size, GameState.maze_size, GameState.maze_seed)
	gen.build(diff_keys, diff_traps, rooms)

	_builder = MazeBuilder.new()
	_builder.name = "Maze"
	add_child(_builder)
	_builder.build(gen)

	GameState.total_keys = _builder.key_positions.size()
	GameState.collected_keys = 0

	_player.teleport(_builder.player_spawn)

	# Connect interaction signals on dynamically created areas.
	for area in get_tree().get_nodes_in_group("keys"):
		area.body_entered.connect(_on_key_touched.bind(area))
		_keys_node_positions.append(area)
	for area in get_tree().get_nodes_in_group("traps"):
		area.body_entered.connect(_on_trap_touched.bind(area))
	for area in get_tree().get_nodes_in_group("exit"):
		area.body_entered.connect(_on_exit_touched)


func _process(delta: float) -> void:
	_timer_label.text = "Time  %s" % _format_time(GameState.elapsed_seconds())
	# Spin + bob the floating keys.
	_spin_t += delta
	for k in _keys_node_positions:
		if is_instance_valid(k):
			k.rotation.y = _spin_t * 1.5
			var mesh := k.get_child(0)
			if mesh is Node3D:
				(mesh as Node3D).position.y = sin(_spin_t * 2.0) * 0.15


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		if _settings_panel.visible:
			return
		_toggle_pause()


# --- Pickups / traps / exit ---
func _on_key_touched(body: Node, area: Area3D) -> void:
	if body != _player or not is_instance_valid(area):
		return
	GameState.collected_keys += 1
	_keys_node_positions.erase(area)
	area.queue_free()
	_update_key_label()
	if GameState.collected_keys >= GameState.total_keys:
		_show_message("All keys collected! Reach the portal!", 3.0)
	else:
		_show_message("Key %d / %d" % [GameState.collected_keys, GameState.total_keys], 1.5)


func _on_trap_touched(body: Node, _area: Area3D) -> void:
	if body != _player:
		return
	# Penalty: shove the player back to spawn (a simple "respawn" trap).
	_show_message("⚠ Trap! Sent back to start.", 2.0)
	_player.teleport(_builder.player_spawn)


func _on_exit_touched(body: Node) -> void:
	if body != _player or _won:
		return
	if GameState.collected_keys < GameState.total_keys:
		_show_message("The portal is sealed — collect all keys first.", 2.0)
		return
	_win()


func _win() -> void:
	_won = true
	_show_message("ESCAPED!  Time: %s" % _format_time(GameState.elapsed_seconds()), 99.0)
	await get_tree().create_timer(3.5).timeout
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	SceneSwitcher.change_scene("res://scenes/MainMenu.tscn")


# --- HUD helpers ---
func _update_key_label() -> void:
	_key_label.text = "Keys  %d / %d" % [GameState.collected_keys, GameState.total_keys]


func _on_stamina_changed(value: float) -> void:
	_stamina_bar.value = value * 100.0


func _show_message(text: String, duration: float) -> void:
	_message.text = text
	_message.modulate.a = 1.0
	var tw := create_tween()
	tw.tween_interval(duration)
	tw.tween_property(_message, "modulate:a", 0.0, 0.6)


func _format_time(s: float) -> String:
	var m := int(s) / 60
	var sec := int(s) % 60
	return "%02d:%02d" % [m, sec]


# --- Pause ---
func _toggle_pause() -> void:
	var paused := not get_tree().paused
	get_tree().paused = paused
	_pause_menu.visible = paused
	_crosshair.visible = not paused
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE if paused else Input.MOUSE_MODE_CAPTURED


func _on_resume_pressed() -> void:
	_toggle_pause()


func _on_settings_pressed() -> void:
	_settings_panel.show()


func _on_menu_pressed() -> void:
	get_tree().paused = false
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	SceneSwitcher.change_scene("res://scenes/MainMenu.tscn")


func _on_quit_pressed() -> void:
	get_tree().quit()
