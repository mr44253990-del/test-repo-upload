extends Node3D
## Gameplay root for "Rakib". Builds the maze, spawns the player, wires the
## HUD, handles coins / keys / health / danger pits / the exit, health & death,
## win & lose states, music and pausing.

@onready var _player: CharacterBody3D = $Player
@onready var _key_label: Label = $HUD/Top/KeyLabel
@onready var _coin_label: Label = $HUD/Top/CoinLabel
@onready var _timer_label: Label = $HUD/Top/TimerLabel
@onready var _stamina_bar: ProgressBar = $HUD/Bottom/StaminaBar
@onready var _health_bar: ProgressBar = $HUD/Bottom/HealthBar
@onready var _message: Label = $HUD/Center/Message
@onready var _pause_menu: Control = $HUD/PauseMenu
@onready var _settings_panel: Control = $HUD/PauseSettings
@onready var _crosshair: Control = $HUD/Crosshair

const DANGER_DAMAGE := 9999.0       # danger pits are instant-restart
const TRAP_DAMAGE := 25.0

var _builder: MazeBuilder
var _won := false
var _spin_t := 0.0
var _spinnables: Array[Node3D] = []


func _ready() -> void:
	_build_world()
	_player.stamina_changed.connect(_on_stamina_changed)
	_player.health_changed.connect(_on_health_changed)
	_player.died.connect(_on_player_died)
	_pause_menu.hide()
	_settings_panel.hide()
	_update_labels()
	Audio.play_music()
	_show_message("Collect keys & coins. Avoid danger. Reach the green portal!", 4.0)


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
	GameState.coins = 0

	_player.teleport(_builder.player_spawn)

	for area in get_tree().get_nodes_in_group("keys"):
		area.body_entered.connect(_on_key_touched.bind(area))
		_spinnables.append(area)
	for area in get_tree().get_nodes_in_group("coins"):
		area.body_entered.connect(_on_coin_touched.bind(area))
		_spinnables.append(area)
	for area in get_tree().get_nodes_in_group("health"):
		area.body_entered.connect(_on_health_touched.bind(area))
		_spinnables.append(area)
	for area in get_tree().get_nodes_in_group("traps"):
		area.body_entered.connect(_on_trap_touched.bind(area))
	for area in get_tree().get_nodes_in_group("exit"):
		area.body_entered.connect(_on_exit_touched)


func _process(delta: float) -> void:
	_timer_label.text = "Time  %s" % _format_time(GameState.elapsed_seconds())
	_spin_t += delta
	for k in _spinnables:
		if is_instance_valid(k):
			k.rotation.y = _spin_t * 1.6
			var mesh := k.get_child(0)
			if mesh is Node3D:
				(mesh as Node3D).position.y = sin(_spin_t * 2.2) * 0.12


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("pause"):
		if _settings_panel.visible:
			return
		_toggle_pause()


# --- Pickups ---
func _on_key_touched(body: Node, area: Area3D) -> void:
	if body != _player or not is_instance_valid(area):
		return
	GameState.collected_keys += 1
	_spinnables.erase(area)
	area.queue_free()
	Audio.play("key")
	_update_labels()
	if GameState.collected_keys >= GameState.total_keys:
		_show_message("All keys collected! Reach the portal!", 3.0)
	else:
		_show_message("Key %d / %d" % [GameState.collected_keys, GameState.total_keys], 1.2)


func _on_coin_touched(body: Node, area: Area3D) -> void:
	if body != _player or not is_instance_valid(area):
		return
	GameState.coins += 1
	_spinnables.erase(area)
	area.queue_free()
	Audio.play("coin", randf_range(0.97, 1.05))
	_update_labels()


func _on_health_touched(body: Node, area: Area3D) -> void:
	if body != _player or not is_instance_valid(area):
		return
	_spinnables.erase(area)
	area.queue_free()
	_player.heal(35.0)
	Audio.play("coin", 0.6)
	_show_message("+35 Health", 1.2)


func _on_trap_touched(body: Node, _area: Area3D) -> void:
	if body != _player:
		return
	Audio.play("trap")
	_player.take_damage(TRAP_DAMAGE)
	if _player.health > 0.0:
		_show_message("⚠ Trap! -%d HP, sent to start." % int(TRAP_DAMAGE), 2.0)
		_player.teleport(_builder.player_spawn)


func _on_exit_touched(body: Node) -> void:
	if body != _player or _won:
		return
	if GameState.collected_keys < GameState.total_keys:
		_show_message("The portal is sealed — collect all keys first.", 2.0)
		return
	_win()


# --- Win / lose ---
func _win() -> void:
	_won = true
	Audio.play("win")
	var reward := GameState.coins * 10 + 100
	_show_message("ESCAPED!  Coins: %d   Reward: %d pts   Time: %s" %
		[GameState.coins, reward, _format_time(GameState.elapsed_seconds())], 99.0)
	await get_tree().create_timer(4.0).timeout
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	SceneSwitcher.change_scene("res://scenes/MainMenu.tscn")


func _on_player_died() -> void:
	_show_message("☠ You died! Restarting maze...", 2.0)
	await get_tree().create_timer(2.0).timeout
	_restart_run()


## Full restart from the beginning (used by danger pits and death).
func _restart_run() -> void:
	GameState.collected_keys = 0
	GameState.coins = 0
	GameState.start_time_ms = Time.get_ticks_msec()
	# Rebuild the same maze from scratch.
	_builder.queue_free()
	_spinnables.clear()
	_won = false
	await get_tree().process_frame
	_build_world()
	_player.reset_full()
	_update_labels()
	_show_message("Run reset. Try again!", 2.0)


# --- HUD ---
func _update_labels() -> void:
	_key_label.text = "Keys  %d / %d" % [GameState.collected_keys, GameState.total_keys]
	_coin_label.text = "Coins  %d" % GameState.coins


func _on_stamina_changed(value: float) -> void:
	_stamina_bar.value = value * 100.0


func _on_health_changed(value: float, max_value: float) -> void:
	_health_bar.value = value / max_value * 100.0


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
	Audio.play("click")
	_toggle_pause()


func _on_settings_pressed() -> void:
	Audio.play("click")
	_settings_panel.show()


func _on_menu_pressed() -> void:
	Audio.play("click")
	get_tree().paused = false
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	SceneSwitcher.change_scene("res://scenes/MainMenu.tscn")


func _on_quit_pressed() -> void:
	get_tree().quit()
