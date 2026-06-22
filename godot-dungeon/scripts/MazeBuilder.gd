class_name MazeBuilder
extends Node3D
## Turns a MazeGenerator grid into 3D geometry: floor, ceiling, walls (as
## StaticBody3D for collision), plus pickups (keys), traps, the exit portal
## and torches for lighting. Uses shared BoxMesh/material resources so even
## large mazes stay light on memory.

const CELL := 4.0          # metres per cell
const WALL_H := 3.2
const WALL_T := 0.25

var maze: MazeGenerator

# Shared resources
var _wall_mesh: BoxMesh
var _floor_mesh: BoxMesh
var _wall_mat: StandardMaterial3D
var _floor_mat: StandardMaterial3D
var _ceil_mat: StandardMaterial3D

# Output anchors (world positions) for the Game scene to use.
var player_spawn: Vector3
var exit_position: Vector3
var key_positions: Array[Vector3] = []
var trap_positions: Array[Vector3] = []
var coin_positions: Array[Vector3] = []
var health_positions: Array[Vector3] = []


func cell_to_world(cx: int, cy: int) -> Vector3:
	return Vector3(cx * CELL + CELL * 0.5, 0.0, cy * CELL + CELL * 0.5)


func build(generator: MazeGenerator) -> void:
	maze = generator
	_make_resources()
	_build_floor_and_ceiling()
	_build_walls()
	_build_features()
	_build_torches()
	player_spawn = cell_to_world(maze.start_cell.x, maze.start_cell.y) + Vector3(0, 1.0, 0)
	exit_position = cell_to_world(maze.exit_cell.x, maze.exit_cell.y)


func _make_resources() -> void:
	_wall_mat = StandardMaterial3D.new()
	_wall_mat.albedo_color = Color(0.32, 0.30, 0.27)
	_wall_mat.roughness = 0.95
	_wall_mat.metallic = 0.0

	_floor_mat = StandardMaterial3D.new()
	_floor_mat.albedo_color = Color(0.18, 0.17, 0.16)
	_floor_mat.roughness = 1.0

	_ceil_mat = StandardMaterial3D.new()
	_ceil_mat.albedo_color = Color(0.10, 0.10, 0.11)
	_ceil_mat.roughness = 1.0

	_wall_mesh = BoxMesh.new()
	_wall_mesh.size = Vector3(CELL, WALL_H, WALL_T)
	_wall_mesh.material = _wall_mat

	_floor_mesh = BoxMesh.new()
	_floor_mesh.size = Vector3(CELL, 0.2, CELL)


func _build_floor_and_ceiling() -> void:
	var total_w := maze.width * CELL
	var total_h := maze.height * CELL

	# One big floor slab with a single collider — cheaper than per-cell.
	var floor_body := StaticBody3D.new()
	floor_body.name = "Floor"
	add_child(floor_body)
	var fmesh := BoxMesh.new()
	fmesh.size = Vector3(total_w, 0.4, total_h)
	fmesh.material = _floor_mat
	var fmi := MeshInstance3D.new()
	fmi.mesh = fmesh
	fmi.position = Vector3(total_w * 0.5, -0.2, total_h * 0.5)
	floor_body.add_child(fmi)
	var fcol := CollisionShape3D.new()
	var fshape := BoxShape3D.new()
	fshape.size = fmesh.size
	fcol.shape = fshape
	fcol.position = fmi.position
	floor_body.add_child(fcol)

	# Ceiling (no collider needed; player can't fly).
	var cmesh := BoxMesh.new()
	cmesh.size = Vector3(total_w, 0.3, total_h)
	cmesh.material = _ceil_mat
	var cmi := MeshInstance3D.new()
	cmi.mesh = cmesh
	cmi.position = Vector3(total_w * 0.5, WALL_H, total_h * 0.5)
	add_child(cmi)


func _build_walls() -> void:
	var walls := StaticBody3D.new()
	walls.name = "Walls"
	add_child(walls)

	# Track placed wall segments so shared edges aren't doubled.
	var placed := {}

	for y in maze.height:
		for x in maze.width:
			var base := cell_to_world(x, y)
			# North wall
			if not maze.is_open(x, y, MazeGenerator.N):
				_try_wall(walls, placed, "h_%d_%d" % [x, y],
					base + Vector3(0, WALL_H * 0.5, -CELL * 0.5), false)
			# West wall
			if not maze.is_open(x, y, MazeGenerator.W):
				_try_wall(walls, placed, "v_%d_%d" % [x, y],
					base + Vector3(-CELL * 0.5, WALL_H * 0.5, 0), true)
			# Outer south border
			if y == maze.height - 1 and not maze.is_open(x, y, MazeGenerator.S):
				_try_wall(walls, placed, "h_%d_%d" % [x, y + 1],
					base + Vector3(0, WALL_H * 0.5, CELL * 0.5), false)
			# Outer east border
			if x == maze.width - 1 and not maze.is_open(x, y, MazeGenerator.E):
				_try_wall(walls, placed, "v_%d_%d" % [x + 1, y],
					base + Vector3(CELL * 0.5, WALL_H * 0.5, 0), true)


func _try_wall(parent: Node3D, placed: Dictionary, key: String, pos: Vector3, vertical: bool) -> void:
	if placed.has(key):
		return
	placed[key] = true
	var mi := MeshInstance3D.new()
	mi.mesh = _wall_mesh
	mi.position = pos
	if vertical:
		mi.rotation.y = PI * 0.5
	parent.add_child(mi)

	var col := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = _wall_mesh.size
	col.shape = shape
	col.position = pos
	if vertical:
		col.rotation.y = PI * 0.5
	parent.add_child(col)


func _build_features() -> void:
	# Keys
	key_positions.clear()
	for c in maze.key_cells:
		var p := cell_to_world(c.x, c.y) + Vector3(0, 1.0, 0)
		key_positions.append(p)
		_spawn_key(p)

	# Traps
	trap_positions.clear()
	for c in maze.trap_cells:
		var p := cell_to_world(c.x, c.y)
		trap_positions.append(p)
		_spawn_trap(p)

	# Coins: scatter along several cells (skip start/exit).
	coin_positions.clear()
	var coin_cells := _pick_cells(maze.width * maze.height / 6, [maze.start_cell, maze.exit_cell])
	for c in coin_cells:
		var p := cell_to_world(c.x, c.y) + Vector3(0, 0.9, 0)
		coin_positions.append(p)
		_spawn_coin(p)

	# Health pickups: a few rarer ones.
	health_positions.clear()
	var hp_cells := _pick_cells(max(2, maze.width / 4), [maze.start_cell, maze.exit_cell])
	for c in hp_cells:
		var p := cell_to_world(c.x, c.y) + Vector3(0, 0.9, 0)
		health_positions.append(p)
		_spawn_health(p)

	# Exit portal
	_spawn_exit(cell_to_world(maze.exit_cell.x, maze.exit_cell.y))


func _pick_cells(count: int, exclude: Array) -> Array[Vector2i]:
	var pool: Array[Vector2i] = []
	var ex := {}
	for e in exclude:
		ex[e] = true
	for y in maze.height:
		for x in maze.width:
			var c := Vector2i(x, y)
			if not ex.has(c):
				pool.append(c)
	# Seeded Fisher-Yates so placement is reproducible from the maze seed.
	for i in range(pool.size() - 1, 0, -1):
		var j := maze.rng.randi_range(0, i)
		var tmp := pool[i]
		pool[i] = pool[j]
		pool[j] = tmp
	var result: Array[Vector2i] = pool.slice(0, clampi(count, 0, pool.size()))
	return result


func _spawn_key(pos: Vector3) -> void:
	var area := Area3D.new()
	area.position = pos
	area.add_to_group("keys")
	add_child(area)

	var mesh := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(0.4, 0.4, 0.4)
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(1.0, 0.85, 0.2)
	m.emission_enabled = true
	m.emission = Color(1.0, 0.8, 0.1)
	m.emission_energy_multiplier = 2.0
	box.material = m
	mesh.mesh = box
	area.add_child(mesh)

	var light := OmniLight3D.new()
	light.light_color = Color(1.0, 0.8, 0.3)
	light.omni_range = 5.0
	light.light_energy = 1.2
	area.add_child(light)

	var col := CollisionShape3D.new()
	var sphere := SphereShape3D.new()
	sphere.radius = 1.0
	col.shape = sphere
	area.add_child(col)

	# Slow spin + bob via a property tween started by the Game scene's process.
	area.set_meta("spin", true)


func _spawn_coin(pos: Vector3) -> void:
	var area := Area3D.new()
	area.position = pos
	area.add_to_group("coins")
	add_child(area)

	var mesh := MeshInstance3D.new()
	var coin := CylinderMesh.new()
	coin.top_radius = 0.28
	coin.bottom_radius = 0.28
	coin.height = 0.06
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(1.0, 0.82, 0.15)
	m.metallic = 0.9
	m.roughness = 0.25
	m.emission_enabled = true
	m.emission = Color(1.0, 0.7, 0.1)
	m.emission_energy_multiplier = 0.8
	coin.material = m
	mesh.mesh = coin
	mesh.rotation.x = PI * 0.5   # stand the coin upright
	area.add_child(mesh)

	var col := CollisionShape3D.new()
	var sphere := SphereShape3D.new()
	sphere.radius = 0.7
	col.shape = sphere
	area.add_child(col)


func _spawn_health(pos: Vector3) -> void:
	var area := Area3D.new()
	area.position = pos
	area.add_to_group("health")
	add_child(area)

	var mesh := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(0.5, 0.5, 0.5)
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(0.9, 0.15, 0.2)
	m.emission_enabled = true
	m.emission = Color(1.0, 0.1, 0.2)
	m.emission_energy_multiplier = 1.5
	box.material = m
	mesh.mesh = box
	area.add_child(mesh)

	var light := OmniLight3D.new()
	light.light_color = Color(1.0, 0.3, 0.3)
	light.omni_range = 4.0
	light.light_energy = 1.0
	area.add_child(light)

	var col := CollisionShape3D.new()
	var sphere := SphereShape3D.new()
	sphere.radius = 0.9
	col.shape = sphere
	area.add_child(col)


func _spawn_trap(pos: Vector3) -> void:
	var area := Area3D.new()
	area.position = pos + Vector3(0, 0.06, 0)
	area.add_to_group("traps")
	add_child(area)

	var mesh := MeshInstance3D.new()
	var plate := BoxMesh.new()
	plate.size = Vector3(CELL * 0.7, 0.08, CELL * 0.7)
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(0.25, 0.05, 0.05)
	m.roughness = 0.8
	plate.material = m
	mesh.mesh = plate
	area.add_child(mesh)

	var col := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = plate.size
	col.shape = shape
	area.add_child(col)


func _spawn_exit(pos: Vector3) -> void:
	var area := Area3D.new()
	area.position = pos + Vector3(0, WALL_H * 0.5, 0)
	area.add_to_group("exit")
	add_child(area)

	var mesh := MeshInstance3D.new()
	var portal := CylinderMesh.new()
	portal.top_radius = 1.2
	portal.bottom_radius = 1.2
	portal.height = WALL_H - 0.4
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(0.2, 0.9, 0.5, 0.6)
	m.emission_enabled = true
	m.emission = Color(0.2, 1.0, 0.6)
	m.emission_energy_multiplier = 3.0
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	portal.material = m
	mesh.mesh = portal
	area.add_child(mesh)

	var light := OmniLight3D.new()
	light.light_color = Color(0.3, 1.0, 0.6)
	light.omni_range = 8.0
	light.light_energy = 2.5
	area.add_child(light)

	var col := CollisionShape3D.new()
	var shape := CylinderShape3D.new()
	shape.radius = 1.4
	shape.height = WALL_H
	col.shape = shape
	area.add_child(col)


func _build_torches() -> void:
	# Sparse warm torches scattered through the maze for atmosphere.
	var step := 3
	for y in range(0, maze.height, step):
		for x in range(0, maze.width, step):
			var light := OmniLight3D.new()
			light.position = cell_to_world(x, y) + Vector3(0, WALL_H - 0.6, 0)
			light.light_color = Color(1.0, 0.6, 0.25)
			light.omni_range = CELL * 2.2
			light.light_energy = 0.9
			light.shadow_enabled = false
			add_child(light)
