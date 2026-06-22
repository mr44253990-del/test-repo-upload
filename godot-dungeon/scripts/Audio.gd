extends Node
## Audio autoload — synthesizes all sound effects + ambient music in code
## (no asset files needed) by baking AudioStreamWAV clips, and plays them
## through pooled AudioStreamPlayers routed to the SFX / Music buses.
##
## Call: Audio.play("coin"), Audio.play("hurt"), etc.
## Replace later by dropping real files in and mapping names -> streams.

const MIX_RATE := 22050

var _sfx: Dictionary = {}            # name -> AudioStreamWAV
var _sfx_pool: Array[AudioStreamPlayer] = []
var _pool_size := 8
var _next := 0

var _music_player: AudioStreamPlayer


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build_sfx()
	_build_pool()
	_build_music()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
func play(name: String, pitch: float = 1.0, volume_db: float = 0.0) -> void:
	if not _sfx.has(name):
		return
	var p := _sfx_pool[_next]
	_next = (_next + 1) % _sfx_pool.size()
	p.stream = _sfx[name]
	p.pitch_scale = pitch
	p.volume_db = volume_db
	p.play()


func play_music() -> void:
	if _music_player and not _music_player.playing:
		_music_player.play()


func stop_music() -> void:
	if _music_player:
		_music_player.stop()


# ---------------------------------------------------------------------------
# Pool + music setup
# ---------------------------------------------------------------------------
func _build_pool() -> void:
	for i in _pool_size:
		var p := AudioStreamPlayer.new()
		p.bus = "SFX"
		add_child(p)
		_sfx_pool.append(p)


func _build_music() -> void:
	_music_player = AudioStreamPlayer.new()
	_music_player.bus = "Music"
	_music_player.stream = _make_ambient_drone()
	_music_player.volume_db = -6.0
	add_child(_music_player)


# ---------------------------------------------------------------------------
# Sound design — each is a short procedurally generated waveform
# ---------------------------------------------------------------------------
func _build_sfx() -> void:
	_sfx["coin"]   = _tone_sequence([880.0, 1320.0], 0.10, 0.35)
	_sfx["key"]    = _tone_sequence([660.0, 990.0, 1320.0], 0.09, 0.35)
	_sfx["hurt"]   = _noise_burst(0.25, 0.4, 600.0)
	_sfx["step"]   = _noise_burst(0.06, 0.18, 1200.0)
	_sfx["jump"]   = _sweep(300.0, 700.0, 0.15, 0.3)
	_sfx["land"]   = _noise_burst(0.10, 0.3, 400.0)
	_sfx["trap"]   = _sweep(500.0, 80.0, 0.5, 0.5)
	_sfx["win"]    = _tone_sequence([523.0, 659.0, 784.0, 1046.0], 0.14, 0.4)
	_sfx["death"]  = _sweep(440.0, 60.0, 0.7, 0.5)
	_sfx["click"]  = _tone_sequence([1200.0], 0.05, 0.3)
	_sfx["flash"]  = _tone_sequence([2000.0], 0.04, 0.25)


# A WAV from a per-sample callback f(t_seconds) -> amplitude [-1, 1].
func _make_wav(duration: float, generator: Callable) -> AudioStreamWAV:
	var count := int(duration * MIX_RATE)
	var bytes := PackedByteArray()
	bytes.resize(count * 2)            # 16-bit mono
	for i in count:
		var t := float(i) / MIX_RATE
		var v: float = clampf(generator.call(t), -1.0, 1.0)
		var s := int(v * 32767.0)
		bytes.encode_s16(i * 2, s)
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = MIX_RATE
	wav.stereo = false
	wav.data = bytes
	return wav


func _env(t: float, dur: float, attack: float = 0.01) -> float:
	# Simple attack + exponential decay envelope.
	if t < attack:
		return t / attack
	return exp(-(t - attack) * 5.0 / max(0.0001, dur))


# Series of pure tones played back-to-back (arpeggio / pickup chimes).
func _tone_sequence(freqs: Array, note_dur: float, amp: float) -> AudioStreamWAV:
	var total := note_dur * freqs.size()
	return _make_wav(total, func(t):
		var idx := int(t / note_dur)
		idx = clampi(idx, 0, freqs.size() - 1)
		var local_t := t - idx * note_dur
		var f: float = freqs[idx]
		return sin(t * f * TAU) * _env(local_t, note_dur) * amp)


# Filtered-ish noise burst (steps, hits, landings).
func _noise_burst(dur: float, amp: float, _cutoff: float) -> AudioStreamWAV:
	var last := 0.0
	return _make_wav(dur, func(t):
		var n := randf_range(-1.0, 1.0)
		# crude one-pole lowpass for a softer "thud"
		last = lerp(last, n, 0.3)
		return last * _env(t, dur, 0.005) * amp)


# Frequency sweep (jumps, traps, death stingers).
func _sweep(f_start: float, f_end: float, dur: float, amp: float) -> AudioStreamWAV:
	return _make_wav(dur, func(t):
		var k := t / dur
		var f: float = lerp(f_start, f_end, k)
		return sin(t * f * TAU) * _env(t, dur, 0.01) * amp)


# Low, slow evolving drone used as looping ambient "music".
func _make_ambient_drone() -> AudioStreamWAV:
	var dur := 6.0
	var wav := _make_wav(dur, func(t):
		var a := sin(t * 55.0 * TAU)
		var b := sin(t * 82.5 * TAU) * 0.6
		var c := sin(t * 110.0 * TAU + sin(t * 0.5) * 2.0) * 0.4
		var swell := 0.5 + 0.5 * sin(t * 0.25 * TAU)
		return (a + b + c) / 3.0 * swell * 0.5)
	wav.loop_mode = AudioStreamWAV.LOOP_FORWARD
	wav.loop_begin = 0
	wav.loop_end = int(dur * MIX_RATE) - 1
	return wav
