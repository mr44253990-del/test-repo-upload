extends Panel
## Settings UI — graphics, audio and gameplay. Reads/writes the Settings
## autoload and persists on close. Reusable from both the main menu and the
## in-game pause menu.

@onready var _fullscreen: CheckButton = $Margin/Scroll/VBox/Graphics/Fullscreen
@onready var _vsync: CheckButton = $Margin/Scroll/VBox/Graphics/VSync
@onready var _resolution: OptionButton = $Margin/Scroll/VBox/Graphics/ResRow/Resolution
@onready var _quality: OptionButton = $Margin/Scroll/VBox/Graphics/QualityRow/Quality
@onready var _msaa: OptionButton = $Margin/Scroll/VBox/Graphics/MSAARow/MSAA
@onready var _render_scale: HSlider = $Margin/Scroll/VBox/Graphics/ScaleRow/RenderScale
@onready var _render_scale_val: Label = $Margin/Scroll/VBox/Graphics/ScaleRow/ScaleVal
@onready var _fov: HSlider = $Margin/Scroll/VBox/Graphics/FovRow/Fov
@onready var _fov_val: Label = $Margin/Scroll/VBox/Graphics/FovRow/FovVal

@onready var _master: HSlider = $Margin/Scroll/VBox/Audio/MasterRow/Master
@onready var _music: HSlider = $Margin/Scroll/VBox/Audio/MusicRow/Music
@onready var _sfx: HSlider = $Margin/Scroll/VBox/Audio/SfxRow/Sfx

@onready var _sensitivity: HSlider = $Margin/Scroll/VBox/Gameplay/SensRow/Sensitivity
@onready var _invert_y: CheckButton = $Margin/Scroll/VBox/Gameplay/InvertY


func _ready() -> void:
	_populate_dropdowns()
	_load_from_settings()
	_connect_signals()


func _populate_dropdowns() -> void:
	_resolution.clear()
	for r in Settings.RESOLUTIONS:
		_resolution.add_item("%dx%d" % [r.x, r.y])
	_quality.clear()
	for q in Settings.QUALITY_NAMES:
		_quality.add_item(q)
	_msaa.clear()
	for m in Settings.MSAA_NAMES:
		_msaa.add_item(m)


func _load_from_settings() -> void:
	_fullscreen.button_pressed = Settings.fullscreen
	_vsync.button_pressed = Settings.vsync
	_resolution.select(Settings.resolution_index)
	_quality.select(Settings.quality_preset)
	_msaa.select(Settings.msaa_index)
	_render_scale.value = Settings.render_scale
	_render_scale_val.text = "%d%%" % int(Settings.render_scale * 100)
	_fov.value = Settings.fov
	_fov_val.text = "%d" % int(Settings.fov)
	_master.value = Settings.master_volume
	_music.value = Settings.music_volume
	_sfx.value = Settings.sfx_volume
	_sensitivity.value = Settings.mouse_sensitivity
	_invert_y.button_pressed = Settings.invert_y


func _connect_signals() -> void:
	_fullscreen.toggled.connect(func(v):
		Settings.fullscreen = v; Settings.apply_window())
	_vsync.toggled.connect(func(v):
		Settings.vsync = v; Settings.apply_window())
	_resolution.item_selected.connect(func(i):
		Settings.resolution_index = i; Settings.apply_window())
	_quality.item_selected.connect(func(i):
		Settings.quality_preset = i; Settings.apply_quality())
	_msaa.item_selected.connect(func(i):
		Settings.msaa_index = i; Settings.apply_quality())
	_render_scale.value_changed.connect(func(v):
		Settings.render_scale = v
		_render_scale_val.text = "%d%%" % int(v * 100)
		Settings.apply_quality())
	_fov.value_changed.connect(func(v):
		Settings.fov = v
		_fov_val.text = "%d" % int(v))
	_master.value_changed.connect(func(v):
		Settings.master_volume = v; Settings.apply_audio())
	_music.value_changed.connect(func(v):
		Settings.music_volume = v; Settings.apply_audio())
	_sfx.value_changed.connect(func(v):
		Settings.sfx_volume = v; Settings.apply_audio())
	_sensitivity.value_changed.connect(func(v):
		Settings.mouse_sensitivity = v)
	_invert_y.toggled.connect(func(v):
		Settings.invert_y = v)


func _on_close_pressed() -> void:
	Settings.save_settings()
	hide()
