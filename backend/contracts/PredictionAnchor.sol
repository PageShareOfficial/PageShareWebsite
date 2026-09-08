// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title PredictionAnchor
/// @notice Public, immutable snapshot of a PageShare prediction (no personal data).
/// @dev Deploy from the platform relayer wallet (that address becomes owner).
///      Postgres remains the source of truth. Do not emit user id, thesis, or media.
contract PredictionAnchor {
    address public owner;

    /// @notice Trade fields only. No user id, thesis, or media.
    struct PublicPrediction {
        string asset;
        string position;
        string entryPrice;
        string targetPrice;
        string stopLoss;
        string confidence;
        uint256 lockStartedAt;
        uint256 expiryAt;
    }

    event PredictionAnchored(
        bytes32 indexed predictionId,
        PublicPrediction prediction,
        bytes32 contentHash,
        uint256 timestamp
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    /// @param predictionId Opaque prediction UUID (not a user id).
    /// @param prediction Public trade fields (ticker, side, prices, window).
    /// @param contentHash SHA-256 of the canonical payload (thesis excluded).
    function anchor(
        bytes32 predictionId,
        PublicPrediction calldata prediction,
        bytes32 contentHash
    ) external onlyOwner {
        emit PredictionAnchored(
            predictionId,
            prediction,
            contentHash,
            block.timestamp
        );
    }
}
