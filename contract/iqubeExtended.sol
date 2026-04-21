// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./iqube.sol";

/// @title iQubeNFTExtended
/// @notice Test/future-behavior wrapper around iQubeNFT that exposes burn and
///         a totalMinted view. This contract is NOT deployed to production —
///         it exists to let the test suite exercise burn behavior that the
///         base contract does not yet expose publicly.
/// @dev The test suite treats burn as a *specification under test*: when the
///      real contract eventually adds burnQube(), these tests move from the
///      extended wrapper to the production contract with minimal change.
contract iQubeNFTExtended is iQubeNFT {
    uint256 private _mintedCount;

    constructor(address initialOwner) iQubeNFT(initialOwner) {}

    /// @notice Burns a token owned by the caller.
    /// @dev Uses OZ ERC721's internal _burn. Requires msg.sender == owner.
    ///      Intentionally also callable when paused? No — mirrors mint policy
    ///      and enforces whenNotPaused for consistency.
    function burnQube(uint256 tokenId) public whenNotPaused nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "iQube: caller is not owner");
        _burn(tokenId);
    }

    /// @notice Override mintQube so we can track total minted for invariant tests.
    /// @dev We intentionally do NOT change base behavior; we only add counting.
    function mintQubeTracked(
        address to,
        string memory uri,
        string memory encryptionKey
    ) public whenNotPaused nonReentrant {
        _mintedCount += 1;
        // Replicate mintQube semantics by calling the parent path via safeMint.
        // We can't call mintQube() because it's non-virtual and would double-guard.
        uint256 tokenId = _mintedCount - 1;
        _safeMint(to, tokenId);
        _setTokenURIExposed(tokenId, uri);
        _setEncryptionKeyExposed(tokenId, encryptionKey);
    }

    /// @notice Total number of mints performed via mintQubeTracked.
    function totalMinted() public view returns (uint256) {
        return _mintedCount;
    }

    // ── Exposed internals for the tracked-mint path ───────────────────────────
    // These mirror the internal storage writes in the base contract. Since the
    // base contract's _tokenURIs / _encryptionKeys are private, we cannot reach
    // them directly. We keep a parallel extended mapping scoped to this contract.

    mapping(uint256 => string) private _extTokenURIs;
    mapping(uint256 => string) private _extEncryptionKeys;

    function _setTokenURIExposed(uint256 tokenId, string memory uri) internal {
        _extTokenURIs[tokenId] = uri;
    }

    function _setEncryptionKeyExposed(uint256 tokenId, string memory key) internal {
        _extEncryptionKeys[tokenId] = key;
    }

    function extTokenURI(uint256 tokenId) public view returns (string memory) {
        return _extTokenURIs[tokenId];
    }

    function extEncryptionKey(uint256 tokenId) public view returns (string memory) {
        require(ownerOf(tokenId) == msg.sender, "iQube: caller is not owner");
        return _extEncryptionKeys[tokenId];
    }
}
