extends Node
## GameState autoload — holds run-specific data shared across scenes,
## such as the maze seed, difficulty, and player progress.

enum Difficulty { EASY, NORMAL, HARD }

var maze_seed: int = 0
var difficulty: int = Difficulty.NORMAL
var maze_size: int = 16          # grid is maze_size x maze_size cells
var collected_keys: int = 0
var total_keys: int = 0
var start_time_ms: int = 0


func new_run(custom_seed: int = -1) -> void:
	maze_seed = custom_seed if custom_seed >= 0 else randi()
	collected_keys = 0
	total_keys = 0
	start_time_ms = Time.get_ticks_msec()


func elapsed_seconds() -> float:
	return float(Time.get_ticks_msec() - start_time_ms) / 1000.0


func difficulty_name() -> String:
	match difficulty:
		Difficulty.EASY: return "Easy"
		Difficulty.HARD: return "Hard"
		_: return "Normal"
