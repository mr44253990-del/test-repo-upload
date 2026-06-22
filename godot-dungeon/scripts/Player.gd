extends CharacterBody3D
## Third-person player controller for "Rakib".
##
## - WASD movement relative to camera facing
## - Mouse orbit camera on a SpringArm3D so the camera NEVER clips through
##   walls (the spring arm auto-pulls in when geometry is behind it)
## - Sprint + stamina, jump, gravity (high-quality physics tuning)
## - Health system with damage / death
## - Footstep, jump, land sounds
##
## A visible capsule mesh represents the player body in third person.

@export var walk_speed := 4.5
@export var sprint_speed := 8.0
@export var jump_velocity := 5.2
@export var accel := 14.0
@export var air_accel := 4.0
@export var rotation_speed := 12.0
@export var max_health := 100.0

@onready var _yaw: Node3D = $CamYaw
@onready var _pitch: Node3D = $CamYaw/CamPitch
@onready var _spring: SpringArm3D = $CamYaw/CamPitch/SpringArm3D
@onready var _camera: Camera3D = $CamYaw/CamPitch/SpringArm3D/Camera3D
@onready var _body: Node3D = $Body
@onready var _flashlight: SpotLight3D = $CamYaw/CamPitch/SpringArm3D/Camera3D/Flashlight

var _gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity", 9.8)
var _cam_pitch := -0.35
var stamina := 1.0
var health := 100.0
var _flashlight_on := true
var _was_on_floor := true
var _step_t := 0.0
var _alive := true

signal stamina_changed(value: float)
signal health_changed(value: float, max_value: float)
signal died()


func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	health = max_health
	_camera.fov = Settings.fov
	_flashlight.visible = _flashlight_on
	# SpringArm collides with the world so the camera can't pass walls.
	_spring.add_excluded_object(get_rid())
	health_changed.emit(health, max_health)


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		var sens := Settings.mouse_sensitivity
		var inv := -1.0 if Settings.invert_y else 1.0
		_yaw.rotate_y(-event.relative.x * sens)
		_cam_pitch = clamp(_cam_pitch - event.relative.y * sens * inv, -1.2, 0.5)
		_pitch.rotation.x = _cam_pitch

	if event.is_action_pressed("flashlight"):
		_flashlight_on = not _flashlight_on
		_flashlight.visible = _flashlight_on
		Audio.play("flash")


func _physics_process(delta: float) -> void:
	if not _alive:
		return

	# Gravity
	if not is_on_floor():
		velocity.y -= _gravity * delta
	elif Input.is_action_just_pressed("jump"):
		velocity.y = jump_velocity
		Audio.play("jump")

	# Landing sound
	if is_on_floor() and not _was_on_floor and velocity.y <= 0.1:
		Audio.play("land")
	_was_on_floor = is_on_floor()

	# Sprint + stamina
	var input_dir := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var moving := input_dir.length() > 0.1
	var wants_sprint := Input.is_action_pressed("sprint")
	var speed := walk_speed
	if wants_sprint and stamina > 0.0 and moving:
		speed = sprint_speed
		stamina = max(0.0, stamina - delta * 0.35)
	else:
		stamina = min(1.0, stamina + delta * 0.25)
	stamina_changed.emit(stamina)

	# Move relative to where the CAMERA (yaw) is facing.
	var cam_basis := _yaw.global_transform.basis
	var dir := (cam_basis * Vector3(input_dir.x, 0, input_dir.y))
	dir.y = 0
	dir = dir.normalized()

	var a := accel if is_on_floor() else air_accel
	var target := dir * speed
	velocity.x = move_toward(velocity.x, target.x, a * delta)
	velocity.z = move_toward(velocity.z, target.z, a * delta)

	# Rotate the visible body to face movement direction.
	if moving:
		var target_yaw := atan2(dir.x, dir.z)
		_body.rotation.y = lerp_angle(_body.rotation.y, target_yaw, rotation_speed * delta)
		# Footsteps
		_step_t += delta * (speed / walk_speed)
		if _step_t >= 0.45:
			_step_t = 0.0
			if is_on_floor():
				Audio.play("step", randf_range(0.9, 1.1))

	move_and_slide()


# --- Health ---
func take_damage(amount: float) -> void:
	if not _alive:
		return
	health = max(0.0, health - amount)
	health_changed.emit(health, max_health)
	Audio.play("hurt")
	if health <= 0.0:
		_die()


func heal(amount: float) -> void:
	health = min(max_health, health + amount)
	health_changed.emit(health, max_health)


func _die() -> void:
	_alive = false
	Audio.play("death")
	died.emit()


func teleport(pos: Vector3) -> void:
	global_position = pos
	velocity = Vector3.ZERO


func reset_full() -> void:
	_alive = true
	health = max_health
	stamina = 1.0
	health_changed.emit(health, max_health)
	stamina_changed.emit(stamina)
