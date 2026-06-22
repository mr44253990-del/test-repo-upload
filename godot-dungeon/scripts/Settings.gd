extends Node
## Settings autoload — persists graphics / audio / gameplay options to disk
## and applies them globally. Accessible anywhere as `Settings`.

const SAVE_PATH := "user://settings.cfg"

# --- Graphics ---
var fullscreen: bool = false
var vsync: bool = true
var resolution_index: int = 2          # index into RESOLUTIONS
var quality_preset: int = 2            # 0 Low, 1 Medium, 2 High, 3 Ultra
var render_scale: float = 1.0          # 0.5 - 1.0 (FSR-style scaling)
var msaa_index: int = 1                # 0 off, 1 2x, 2 4x, 3 8x
var fov: float = 75.0

# --- Audio ---
var master_volume: float = 0.9
var music_volume: float = 0.7
var sfx_volume: float = 0.85

# --- Gameplay ---
var mouse_sensitivity: float = 0.0025
var invert_y: bool = false

const RESOLUTIONS := [
	Vector2i(1280, 720),
	Vector2i(1600, 900),
	Vector2i(1920, 1080),
	Vector2i(2560, 1440),
]

const QUALITY_NAMES := ["Low", "Medium", "High", "Ultra"]
const MSAA_NAMES := ["Off", "2x", "4x", "8x"]


func _ready() -> void:
	load_settings()
	apply_all()


func apply_all() -> void:
	apply_window()
	apply_quality()
	apply_audio()


func apply_window() -> void:
	if fullscreen:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	else:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_WINDOWED)
		var res: Vector2i = RESOLUTIONS[clamp(resolution_index, 0, RESOLUTIONS.size() - 1)]
		DisplayServer.window_set_size(res)
	DisplayServer.window_set_vsync_mode(
		DisplayServer.VSYNC_ENABLED if vsync else DisplayServer.VSYNC_DISABLED
	)


func apply_quality() -> void:
	var vp := get_viewport()
	if vp == null:
		return
	# Render scaling (cheap upscaler for low-end machines)
	vp.scaling_3d_scale = render_scale
	# MSAA
	var msaa_modes := [
		Viewport.MSAA_DISABLED,
		Viewport.MSAA_2X,
		Viewport.MSAA_4X,
		Viewport.MSAA_8X,
	]
	vp.msaa_3d = msaa_modes[clamp(msaa_index, 0, msaa_modes.size() - 1)]

	# Shadow quality scales with preset
	match quality_preset:
		0:
			vp.positional_shadow_atlas_size = 1024
		1:
			vp.positional_shadow_atlas_size = 2048
		2:
			vp.positional_shadow_atlas_size = 4096
		_:
			vp.positional_shadow_atlas_size = 8192


func apply_audio() -> void:
	_set_bus_volume("Master", master_volume)
	_set_bus_volume("Music", music_volume)
	_set_bus_volume("SFX", sfx_volume)


func _set_bus_volume(bus_name: String, linear: float) -> void:
	var idx := AudioServer.get_bus_index(bus_name)
	if idx == -1:
		# Bus not defined; fall back to Master so volume still does something.
		idx = AudioServer.get_bus_index("Master")
	if idx == -1:
		return
	AudioServer.set_bus_volume_db(idx, linear_to_db(clamp(linear, 0.0001, 1.0)))


func save_settings() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("graphics", "fullscreen", fullscreen)
	cfg.set_value("graphics", "vsync", vsync)
	cfg.set_value("graphics", "resolution_index", resolution_index)
	cfg.set_value("graphics", "quality_preset", quality_preset)
	cfg.set_value("graphics", "render_scale", render_scale)
	cfg.set_value("graphics", "msaa_index", msaa_index)
	cfg.set_value("graphics", "fov", fov)
	cfg.set_value("audio", "master_volume", master_volume)
	cfg.set_value("audio", "music_volume", music_volume)
	cfg.set_value("audio", "sfx_volume", sfx_volume)
	cfg.set_value("gameplay", "mouse_sensitivity", mouse_sensitivity)
	cfg.set_value("gameplay", "invert_y", invert_y)
	cfg.save(SAVE_PATH)


func load_settings() -> void:
	var cfg := ConfigFile.new()
	if cfg.load(SAVE_PATH) != OK:
		return
	fullscreen = cfg.get_value("graphics", "fullscreen", fullscreen)
	vsync = cfg.get_value("graphics", "vsync", vsync)
	resolution_index = cfg.get_value("graphics", "resolution_index", resolution_index)
	quality_preset = cfg.get_value("graphics", "quality_preset", quality_preset)
	render_scale = cfg.get_value("graphics", "render_scale", render_scale)
	msaa_index = cfg.get_value("graphics", "msaa_index", msaa_index)
	fov = cfg.get_value("graphics", "fov", fov)
	master_volume = cfg.get_value("audio", "master_volume", master_volume)
	music_volume = cfg.get_value("audio", "music_volume", music_volume)
	sfx_volume = cfg.get_value("audio", "sfx_volume", sfx_volume)
	mouse_sensitivity = cfg.get_value("gameplay", "mouse_sensitivity", mouse_sensitivity)
	invert_y = cfg.get_value("gameplay", "invert_y", invert_y)
