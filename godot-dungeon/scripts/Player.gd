extends CharacterBody3D
## First-person player controller: WASD movement, mouse look, sprint with
## stamina, jump, gravity, and a toggleable flashlight. Reads tuning from
## the Settings autoload (FOV, sensitivity, invert Y).

@export var walk_speed := 4.5
@export var sprint_speed := 7.5
@export var jump_velocity := 4.8
@export var accel := 12.0

@onready var _head: Node3D = $Head
@onready var _camera: Camera3D = $Head/Camera3D
@onready var _flashlight: SpotLight3D = $Head/Camera3D/Flashlight

var _gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity", 9.8)
var _pitch := 0.0
var stamina := 1.0
var _flashlight_on := true

signal stamina_changed(value: float)


func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	_camera.fov = Settings.fov
	_flashlight.visible = _flashlight_on


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		var sens := Settings.mouse_sensitivity
		var inv := -1.0 if Settings.invert_y else 1.0
		rotate_y(-event.relative.x * sens)
		_pitch = clamp(_pitch - event.relative.y * sens * inv, -1.4, 1.4)
		_head.rotation.x = _pitch

	if event.is_action_pressed("flashlight"):
		_flashlight_on = not _flashlight_on
		_flashlight.visible = _flashlight_on


func _physics_process(delta: float) -> void:
	# Gravity
	if not is_on_floor():
		velocity.y -= _gravity * delta
	elif Input.is_action_just_pressed("jump"):
		velocity.y = jump_velocity

	# Sprint + stamina
	var wants_sprint := Input.is_action_pressed("sprint")
	var moving := velocity.length() > 0.5
	var speed := walk_speed
	if wants_sprint and stamina > 0.0 and moving:
		speed = sprint_speed
		stamina = max(0.0, stamina - delta * 0.35)
	else:
		stamina = min(1.0, stamina + delta * 0.25)
	stamina_changed.emit(stamina)

	# Movement relative to facing
	var input_dir := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var dir := (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	var target := dir * speed
	velocity.x = move_toward(velocity.x, target.x, accel * delta)
	velocity.z = move_toward(velocity.z, target.z, accel * delta)

	move_and_slide()


func teleport(pos: Vector3) -> void:
	global_position = pos
	velocity = Vector3.ZERO
