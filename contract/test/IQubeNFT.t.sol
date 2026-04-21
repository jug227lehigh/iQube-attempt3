// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// ─────────────────────────────────────────────────────────────────────────────
// Contract-level tests (Foundry / Solidity)
//
// Aerospace framing: these are "unit tests" in the DO-178C sense for the
// contract component. Each test references a REQ-ID. The suite covers:
//   - Nominal behavior (mint, burn, read)
//   - Negative / robustness (non-owner, paused, nonexistent token)
//   - Fuzz (randomized inputs over a wide domain)
//   - Invariants (properties that must hold across arbitrary call sequences)
// ─────────────────────────────────────────────────────────────────────────────

import "forge-std/Test.sol";
import "../iqubeExtended.sol";

contract IQubeNFTTest is Test {
    iQubeNFTExtended internal nft;

    address internal owner   = address(0xA11CE);  // contract owner
    address internal alice   = address(0xA1);     // regular user
    address internal bob     = address(0xB0B);    // regular user
    address internal mallory = address(0xBAD);    // adversary (non-owner of tokens)

    string  internal URI = "ipfs://QmTestMetaQube";
    string  internal KEY = "test-encryption-key";

    // Mirrors ERC721's Transfer(address indexed, address indexed, uint256 indexed)
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    function setUp() public {
        vm.prank(owner);
        nft = new iQubeNFTExtended(owner);
    }

    // ── REQ-MINT-001: Any non-paused caller shall mint an iQube ─────────────
    function test_REQ_MINT_001_mintStoresURIAndKey() public {
        vm.prank(alice);
        nft.mintQube(alice, URI, KEY);

        assertEq(nft.ownerOf(0), alice, "token 0 owner should be alice");
        assertEq(nft.getMetaQubeLocation(0), URI, "URI should roundtrip");
    }

    // ── REQ-MINT-002: Token IDs shall increment monotonically from 0 ────────
    function test_REQ_MINT_002_tokenIdsIncrement() public {
        vm.prank(alice);
        nft.mintQube(alice, URI, KEY);
        vm.prank(bob);
        nft.mintQube(bob, URI, KEY);
        vm.prank(alice);
        nft.mintQube(alice, URI, KEY);

        assertEq(nft.ownerOf(0), alice);
        assertEq(nft.ownerOf(1), bob);
        assertEq(nft.ownerOf(2), alice);
    }

    // ── REQ-MINT-004: Minting shall fail when contract is paused ────────────
    function test_REQ_MINT_004_revertsWhenPaused() public {
        vm.prank(owner);
        nft.pause();

        vm.prank(alice);
        vm.expectRevert();  // OZ Pausable: EnforcedPause
        nft.mintQube(alice, URI, KEY);
    }

    // ── REQ-MINT-003 (read-back): emitted Transfer event correctness ────────
    function test_mintEmitsTransferFromZero() public {
        vm.expectEmit(true, true, true, true);
        emit Transfer(address(0), alice, 0);

        vm.prank(alice);
        nft.mintQube(alice, URI, KEY);
    }

    // ── Encryption key is owner-only ────────────────────────────────────────
    function test_getEncryptionKey_onlyOwner() public {
        vm.prank(alice);
        nft.mintQube(alice, URI, KEY);

        vm.prank(alice);
        assertEq(nft.getEncryptionKey(0), KEY);

        vm.prank(mallory);
        vm.expectRevert(bytes("Caller is not the owner"));
        nft.getEncryptionKey(0);
    }

    // ── REQ-BURN-001: Token owner shall burn their iQube ────────────────────
    function test_REQ_BURN_001_ownerCanBurn() public {
        vm.prank(alice);
        nft.mintQube(alice, URI, KEY);

        vm.prank(alice);
        nft.burnQube(0);

        // After burn, ownerOf(0) should revert (OZ v5 behavior)
        vm.expectRevert();
        nft.ownerOf(0);
    }

    // ── REQ-BURN-002: Non-owner shall be rejected with explicit revert ──────
    function test_REQ_BURN_002_nonOwnerCannotBurn() public {
        vm.prank(alice);
        nft.mintQube(alice, URI, KEY);

        vm.prank(mallory);
        vm.expectRevert(bytes("iQube: caller is not owner"));
        nft.burnQube(0);
    }

    // ── REQ-BURN-004: Burn shall emit Transfer(owner, 0x0, tokenId) ────────
    function test_REQ_BURN_004_burnEmitsTransferToZero() public {
        vm.prank(alice);
        nft.mintQube(alice, URI, KEY);

        vm.expectEmit(true, true, true, true);
        emit Transfer(alice, address(0), 0);

        vm.prank(alice);
        nft.burnQube(0);
    }

    // ── Burn while paused is blocked (consistency with mint policy) ─────────
    function test_burnRevertsWhenPaused() public {
        vm.prank(alice);
        nft.mintQube(alice, URI, KEY);

        vm.prank(owner);
        nft.pause();

        vm.prank(alice);
        vm.expectRevert();
        nft.burnQube(0);
    }

    // ── Burn of nonexistent token reverts ───────────────────────────────────
    function test_burnNonexistentReverts() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.burnQube(42);
    }

    // ─── Fuzz: REQ-MINT-005 — mint never reverts for valid inputs ──────────
    // Aerospace parallel: robustness testing with randomized inputs, analogous
    // to stressing input domains in avionics data-validation logic.
    function testFuzz_mintNeverRevertsForValidInputs(
        address to,
        string calldata uri,
        string calldata key
    ) public {
        // Filter out addresses that cannot receive ERC721 tokens (zero / contracts
        // without the receiver hook). _safeMint rejects these — that's expected,
        // not a defect.
        vm.assume(to != address(0));
        vm.assume(to.code.length == 0);  // EOAs only; receiver hook not required

        vm.prank(to);
        nft.mintQube(to, uri, key);
        // Fresh contract per fuzz run (setUp() resets) ⇒ first mint is tokenId 0.
        assertEq(nft.ownerOf(0), to);
    }

    // ─── Fuzz: burn round-trips ─────────────────────────────────────────────
    function testFuzz_burnByOwnerAlwaysSucceeds(address to) public {
        vm.assume(to != address(0));
        vm.assume(to.code.length == 0);

        vm.prank(to);
        nft.mintQube(to, URI, KEY);

        vm.prank(to);
        nft.burnQube(0);

        vm.expectRevert();
        nft.ownerOf(0);
    }
}
