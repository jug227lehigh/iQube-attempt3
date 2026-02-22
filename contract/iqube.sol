// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title iQubeNFT - A contract for minting and managing iQube NFTs
/// @author Zee
/// @notice This contract is used to mint and manage iQube NFTs
/// @dev This contract inherits from ERC721, Ownable, Pausable, and ReentrancyGuard, and soon LayerZero
contract iQubeNFT is ERC721, Ownable, Pausable, ReentrancyGuard {
    uint256 private _tokenIdCounter;                    // uint256 variable as a counter
    mapping(uint256 => string) private _tokenURIs;      // Mapping from token ID to metaQube location (URI)
    mapping(uint256 => string) private _encryptionKeys; // Mapping from token ID to encryption key

    constructor(address initialOwner) ERC721("iQubeNFT", "QNFT") Ownable(initialOwner) {
        transferOwnership(initialOwner);
    }

    // ============================================================
    //                       Internal Functions
    // ============================================================
    // These functions are used internally within the contract to
    // manage token URIs, handle approvals, and other core logic.
    // They are not meant to be called directly by users.
    // ============================================================

  
    function _setTokenURI(
        uint256 tokenId, 
        string memory _tokenURI
    ) internal virtual {
        require(_ownerOf(tokenId) != address(0), "ERC721Metadata: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    // ============================================================
    //                       Public Functions
    // ============================================================
    // These functions are the public interface for the contract.
    // They are meant to be called by users to interact with the 
    // contract.
    // ============================================================


    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "ERC721Metadata: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    function mintQube(
        address to,
        string memory uri,
        string memory encryptionKey
    ) public whenNotPaused nonReentrant {
        uint256 tokenId = _tokenIdCounter;              // use counter
        _tokenIdCounter++;                              // increment counter

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _encryptionKeys[tokenId] = encryptionKey;       // store the encryption key
    }

    function getMetaQubeLocation(
        uint256 tokenId
    ) public view returns (string memory) {
        return tokenURI(tokenId);
    }

    function getEncryptionKey(
        uint256 tokenId
    ) public view returns (string memory) {
        require(ownerOf(tokenId) == msg.sender, "Caller is not the owner");
        return _encryptionKeys[tokenId];
    }

  
    function transferQube(
        address to, 
        uint256 tokenId
    ) public whenNotPaused nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "ERC721: transfer caller is not owner");
        safeTransferFrom(msg.sender, to, tokenId);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

}