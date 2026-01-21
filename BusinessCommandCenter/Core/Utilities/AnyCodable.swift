import Foundation

// MARK: - AnyCodable

/// Type-erased wrapper for JSON values.
/// Enables decoding of dynamically-typed JSON objects like tool inputs.
struct AnyCodable: Codable {
    let value: Any

    // MARK: - Initialization

    init(_ value: Any) {
        self.value = value
    }

    // MARK: - Decodable

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        // Try decoding in order of specificity
        if container.decodeNil() {
            value = NSNull()
        } else if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map(\.value)
        } else if let dictionary = try? container.decode([String: AnyCodable].self) {
            value = dictionary.mapValues(\.value)
        } else {
            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Unable to decode AnyCodable value"
            )
        }
    }

    // MARK: - Encodable

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()

        switch value {
        case is NSNull:
            try container.encodeNil()
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dictionary as [String: Any]:
            try container.encode(dictionary.mapValues { AnyCodable($0) })
        default:
            throw EncodingError.invalidValue(
                value,
                EncodingError.Context(
                    codingPath: container.codingPath,
                    debugDescription: "Unable to encode AnyCodable value of type \(type(of: value))"
                )
            )
        }
    }

    // MARK: - Typed Getters

    /// Returns the value as a String, if it is one.
    var stringValue: String? {
        value as? String
    }

    /// Returns the value as an Int, if it is one.
    var intValue: Int? {
        value as? Int
    }

    /// Returns the value as a Double, if it is one.
    var doubleValue: Double? {
        value as? Double
    }

    /// Returns the value as a Bool, if it is one.
    var boolValue: Bool? {
        value as? Bool
    }

    /// Returns the value as an array, if it is one.
    var arrayValue: [Any]? {
        value as? [Any]
    }

    /// Returns the value as a dictionary, if it is one.
    var dictionaryValue: [String: Any]? {
        value as? [String: Any]
    }

    /// Returns true if the value is null.
    var isNull: Bool {
        value is NSNull
    }
}

// MARK: - Equatable

extension AnyCodable: Equatable {
    static func == (lhs: AnyCodable, rhs: AnyCodable) -> Bool {
        // Compare by JSON representation for simplicity
        let encoder = JSONEncoder()
        guard let lhsData = try? encoder.encode(lhs),
              let rhsData = try? encoder.encode(rhs) else {
            return false
        }
        return lhsData == rhsData
    }
}
