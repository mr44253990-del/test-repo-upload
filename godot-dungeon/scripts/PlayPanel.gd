extends Panel
## Pre-game configuration: difficulty, maze size, seed. Launches the
## loading screen which then loads the gameplay scene.

@onready var _difficulty: OptionButton = $Margin/VBox/DiffRow/Difficulty
@onready var _size_slider: HSlider = $Margin/VBox/SizeRow/SizeSlider
@onready var _size_label: Label = $Margin/VBox/SizeRow/SizeValue
@onready var _seed_edit: LineEdit = $Margin/VBox/SeedRow/SeedEdit


func _ready() -> void:
	_difficulty.clear()
	_difficulty.add_item("Easy")
	_difficulty.add_item("Normal")
	_difficulty.add_item("Hard")
	_difficulty.select(GameState.Difficulty.NORMAL)
	_size_slider.min_value = 8
	_size_slider.max_value = 32
	_size_slider.step = 2
	_size_slider.value = GameState.maze_size
	_update_size_label(_size_slider.value)


func _on_size_slider_value_changed(v: float) -> void:
	_update_size_label(v)


func _update_size_label(v: float) -> void:
	var n := int(v)
	_size_label.text = "%dx%d  (~%d rooms)" % [n, n, n * n / 4]


func _on_random_seed_pressed() -> void:
	_seed_edit.text = str(randi() % 1000000)


func _on_start_pressed() -> void:
	GameState.difficulty = _difficulty.selected
	GameState.maze_size = int(_size_slider.value)
	var custom_seed := -1
	var txt := _seed_edit.text.strip_edges()
	if txt.is_valid_int():
		custom_seed = int(txt)
	elif txt != "":
		custom_seed = abs(hash(txt))  # let players type a word as a seed
	GameState.new_run(custom_seed)
	SceneSwitcher.change_scene("res://scenes/Loading.tscn")


func _on_back_pressed() -> void:
	hide()
