import Foundation
import Speech
import AVFoundation

/// Errors that can occur during speech recognition
enum SpeechError: LocalizedError {
    case recognizerUnavailable
    case permissionDenied
    case audioEngineUnavailable
    case requestCreationFailed

    var errorDescription: String? {
        switch self {
        case .recognizerUnavailable: return "Speech recognition is not available on this device"
        case .permissionDenied: return "Speech recognition permission was denied"
        case .audioEngineUnavailable: return "Audio engine is not available"
        case .requestCreationFailed: return "Could not create speech recognition request"
        }
    }
}

/// Manages speech recognition for voice input
@MainActor
final class SpeechService: ObservableObject {
    // MARK: - Published State
    @Published private(set) var isRecording = false
    @Published private(set) var transcribedText = ""
    @Published private(set) var error: SpeechError?

    // MARK: - Private State
    private var recognizer: SFSpeechRecognizer?
    private var audioEngine: AVAudioEngine?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?

    init() {
        recognizer = SFSpeechRecognizer(locale: Locale.current)
    }

    // MARK: - Permissions

    /// Check if speech recognition is authorized
    var isAuthorized: Bool {
        SFSpeechRecognizer.authorizationStatus() == .authorized
            && AVAudioApplication.shared.recordPermission == .granted
    }

    /// Request speech recognition and microphone permissions
    /// - Returns: true if both permissions granted
    func requestPermissions() async -> Bool {
        // Request speech recognition
        let speechAuthorized = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status == .authorized)
            }
        }

        guard speechAuthorized else {
            error = .permissionDenied
            return false
        }

        // Request microphone
        let micAuthorized = await AVAudioApplication.requestRecordPermission()

        if !micAuthorized {
            error = .permissionDenied
        }

        return speechAuthorized && micAuthorized
    }

    // MARK: - Recording

    /// Start speech recognition
    func startRecording() async throws {
        // Check permissions first
        guard isAuthorized else {
            let granted = await requestPermissions()
            guard granted else { throw SpeechError.permissionDenied }
        }

        // Check recognizer availability
        guard let recognizer, recognizer.isAvailable else {
            throw SpeechError.recognizerUnavailable
        }

        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

        // Create recognition request
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest else {
            throw SpeechError.requestCreationFailed
        }
        recognitionRequest.shouldReportPartialResults = true

        // Setup audio engine
        audioEngine = AVAudioEngine()
        guard let audioEngine else {
            throw SpeechError.audioEngineUnavailable
        }

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)

        // Install tap for audio buffer
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
        }

        // Prepare and start engine
        audioEngine.prepare()
        try audioEngine.start()

        isRecording = true
        transcribedText = ""
        error = nil

        // Start recognition task
        recognitionTask = recognizer.recognitionTask(with: recognitionRequest) { [weak self] result, recognitionError in
            guard let self else { return }

            if let result {
                Task { @MainActor in
                    self.transcribedText = result.bestTranscription.formattedString
                }
            }

            // Handle final result or error
            if recognitionError != nil || result?.isFinal == true {
                Task { @MainActor in
                    self.stopRecording()
                }
            }
        }
    }

    /// Stop speech recognition and clean up
    func stopRecording() {
        // Stop audio engine
        audioEngine?.stop()
        audioEngine?.inputNode.removeTap(onBus: 0)

        // End recognition
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()

        // Clean up
        audioEngine = nil
        recognitionRequest = nil
        recognitionTask = nil
        isRecording = false

        // Deactivate audio session
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    /// Clear any error
    func clearError() {
        error = nil
    }
}
