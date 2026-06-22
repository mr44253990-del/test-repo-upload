class_name MazeGenerator
extends RefCounted
## Procedural maze generation.
##
## Produces a grid where each cell tracks which of its 4 walls are open.
## Algorithm: recursive backtracker (perfect maze) followed by "braiding"
## that removes some dead-ends to create LOOPS / interconnected rooms and
## hidden alternative passages — giving the labyrinth multiple routes and
## a less linear feel.
##
## Wall bit layout per cell (which directions are OPEN):
const N := 1
const E := 2
const S := 4
const W := 8

const DX := {N: 0, E: 1, S: 0, W: -1}
const DY := {N: -1, E: 0, S: 1, W: 0}
const OPPOSITE := {N: S, E: W, S: N, W: E}

var width: int
var height: int
var cells: PackedInt32Array      # width*height, each = open-wall bitmask
var rng := RandomNumberGenerator.new()

# Feature placement (filled by build())
var start_cell := Vector2i.ZERO
var exit_cell := Vector2i.ZERO
var key_cells: Array[Vector2i] = []
var trap_cells: Array[Vector2i] = []
var room_cells: Array[Vector2i] = []   # cells that are part of an open "room"


func _init(w: int, h: int, p_seed: int) -> void:
	width = w
	height = h
	rng.seed = p_seed
	cells = PackedInt32Array()
	cells.resize(w * h)
	for i in cells.size():
		cells[i] = 0


func _idx(x: int, y: int) -> int:
	return y * width + x


func _in_bounds(x: int, y: int) -> bool:
	return x >= 0 and x < width and y >= 0 and y < height


func is_open(x: int, y: int, dir: int) -> bool:
	return (cells[_idx(x, y)] & dir) != 0


## Main entry. Returns nothing; reads results from the public members.
func build(key_count: int, trap_count: int, room_count: int) -> void:
	_carve_backtracker()
	_braid(0.18)                     # remove ~18% of dead ends -> loops
	_carve_rooms(room_count)
	_place_features(key_count, trap_count)


# --- Recursive backtracker (iterative w/ explicit stack) ---
func _carve_backtracker() -> void:
	var visited := PackedByteArray()
	visited.resize(width * height)
	var stack: Array[Vector2i] = []
	var start := Vector2i(rng.randi_range(0, width - 1), rng.randi_range(0, height - 1))
	visited[_idx(start.x, start.y)] = 1
	stack.push_back(start)

	while not stack.is_empty():
		var cur: Vector2i = stack.back()
		var neighbors := _unvisited_neighbors(cur, visited)
		if neighbors.is_empty():
			stack.pop_back()
			continue
		var dir: int = neighbors[rng.randi_range(0, neighbors.size() - 1)]
		var nx: int = cur.x + DX[dir]
		var ny: int = cur.y + DY[dir]
		# Open the wall both ways.
		cells[_idx(cur.x, cur.y)] |= dir
		cells[_idx(nx, ny)] |= OPPOSITE[dir]
		visited[_idx(nx, ny)] = 1
		stack.push_back(Vector2i(nx, ny))


func _unvisited_neighbors(c: Vector2i, visited: PackedByteArray) -> Array:
	var out := []
	for dir in [N, E, S, W]:
		var nx: int = c.x + DX[dir]
		var ny: int = c.y + DY[dir]
		if _in_bounds(nx, ny) and visited[_idx(nx, ny)] == 0:
			out.append(dir)
	return out


# --- Braiding: open extra walls at dead-ends to create loops ---
func _braid(chance: float) -> void:
	for y in height:
		for x in width:
			if _wall_open_count(x, y) == 1 and rng.randf() < chance:
				# It's a dead end; open one more wall to a neighbor.
				var dirs := [N, E, S, W]
				dirs.shuffle()
				for dir in dirs:
					var nx: int = x + DX[dir]
					var ny: int = y + DY[dir]
					if _in_bounds(nx, ny) and not is_open(x, y, dir):
						cells[_idx(x, y)] |= dir
						cells[_idx(nx, ny)] |= OPPOSITE[dir]
						break


func _wall_open_count(x: int, y: int) -> int:
	var v := cells[_idx(x, y)]
	var c := 0
	for dir in [N, E, S, W]:
		if v & dir:
			c += 1
	return c


# --- Carve open rooms (knock out internal walls in a block) ---
func _carve_rooms(count: int) -> void:
	room_cells.clear()
	for i in count:
		var rw := rng.randi_range(2, 4)
		var rh := rng.randi_range(2, 4)
		var ox := rng.randi_range(0, max(0, width - rw))
		var oy := rng.randi_range(0, max(0, height - rh))
		for y in range(oy, min(oy + rh, height)):
			for x in range(ox, min(ox + rw, width)):
				room_cells.append(Vector2i(x, y))
				# Connect to the east neighbor inside the room.
				if x + 1 < ox + rw and x + 1 < width:
					cells[_idx(x, y)] |= E
					cells[_idx(x + 1, y)] |= W
				# Connect to the south neighbor inside the room.
				if y + 1 < oy + rh and y + 1 < height:
					cells[_idx(x, y)] |= S
					cells[_idx(x, y + 1)] |= N


# --- Place start, exit, keys and traps using BFS distance ---
func _place_features(key_count: int, trap_count: int) -> void:
	start_cell = Vector2i(0, 0)
	var dist := _bfs_distances(start_cell)
	# Exit = farthest reachable cell from start.
	var best := -1
	for y in height:
		for x in width:
			var d := dist[_idx(x, y)]
			if d > best:
				best = d
				exit_cell = Vector2i(x, y)

	# Keys: spread across distance bands so the player must explore.
	key_cells.clear()
	var candidates: Array[Vector2i] = []
	for y in height:
		for x in width:
			var c := Vector2i(x, y)
			if c != start_cell and c != exit_cell:
				candidates.append(c)
	candidates.shuffle()
	for i in min(key_count, candidates.size()):
		key_cells.append(candidates[i])

	# Traps: random cells that aren't start/exit/keys.
	trap_cells.clear()
	var taken := {}
	taken[start_cell] = true
	taken[exit_cell] = true
	for k in key_cells:
		taken[k] = true
	var placed := 0
	for c in candidates:
		if placed >= trap_count:
			break
		if not taken.has(c):
			trap_cells.append(c)
			taken[c] = true
			placed += 1


func _bfs_distances(origin: Vector2i) -> PackedInt32Array:
	var dist := PackedInt32Array()
	dist.resize(width * height)
	for i in dist.size():
		dist[i] = -1
	dist[_idx(origin.x, origin.y)] = 0
	var queue: Array[Vector2i] = [origin]
	var head := 0
	while head < queue.size():
		var c: Vector2i = queue[head]
		head += 1
		var d := dist[_idx(c.x, c.y)]
		for dir in [N, E, S, W]:
			if is_open(c.x, c.y, dir):
				var nx: int = c.x + DX[dir]
				var ny: int = c.y + DY[dir]
				if _in_bounds(nx, ny) and dist[_idx(nx, ny)] == -1:
					dist[_idx(nx, ny)] = d + 1
					queue.append(Vector2i(nx, ny))
	return dist
