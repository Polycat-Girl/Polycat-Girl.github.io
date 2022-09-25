// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "erc721b/contracts/ERC721B.sol";

contract PolycatGirl is 
  ERC721B,
  Ownable,
  AccessControl,  
  ReentrancyGuard,
  IERC721Metadata  
{
  using Strings for uint256;

  // ============ Constants ============

  //roles
  bytes32 private constant _MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 private constant _FUNDER_ROLE = keccak256("FUNDER_ROLE");
  bytes32 private constant _CURATOR_ROLE = keccak256("CURATOR_ROLE");
  
  //max amount that can be minted in this collection
  uint16 public constant MAX_SUPPLY = 5555;
  //immutable preview uri json
  string private _PREVIEW_URI;

  // ============ Storage ============

  string private _baseTokenURI;

  // ============ Deploy ============

  /**
   * @dev Sets the base token uri
   */
  constructor(string memory preview, address admin) {
    _setupRole(DEFAULT_ADMIN_ROLE, admin);
    _PREVIEW_URI = preview;
  }

  // ============ Read Methods ============

  /**
   * @dev Returns the token collection name.
   */
  function name() external pure returns(string memory) {
    return "Polycat Girl";
  }

  /**
   * @dev Adding support for ERC2981
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view override(AccessControl, ERC721B, IERC165) returns(bool) {
    //support ERC721
    return interfaceId == type(IERC721Metadata).interfaceId
      //support other things
      || super.supportsInterface(interfaceId);
  }

  /**
   * @dev Returns the token collection symbol.
   */
  function symbol() external pure returns(string memory) {
    return "MEOW";
  }

  /**
   * @dev Returns the Uniform Resource Identifier (URI) for `tokenId` token.
   */
  function tokenURI(
    uint256 tokenId
  ) external view returns(string memory) {
    //revert if token does not exist
    if(!_exists(tokenId)) revert InvalidCall();

    //if metadata is not set
    return bytes(_baseTokenURI).length > 0 
      ? string(
        abi.encodePacked(
          _baseTokenURI, 
          tokenId.toString(), 
          ".json"
        )
      ): _PREVIEW_URI;
  }

  // ============ Write Methods ============

  /**
   * @dev Mints new tokens for the `recipient`. Its token ID will be 
   * automatically assigned. This is for free mint.
   */
  function mint(
    address recipient,
    uint256 quantity, 
    bytes memory proof
  ) external {
    //revert if the quantity being minted exceeds the max supply
    if ((totalSupply() + quantity) > MAX_SUPPLY
      //or if the admin did not approve of the price
      || !hasRole(_MINTER_ROLE, ECDSA.recover(
        ECDSA.toEthSignedMessageHash(
          keccak256(abi.encodePacked("freemint", recipient, quantity))
        ),
        proof
      ))
    ) revert InvalidCall();

    _safeMint(recipient, quantity);
  }

  /**
   * @dev Mints new tokens for the `recipient`. Its token ID will be 
   * automatically assigned. This is for public mint.
   */
  function mint(
    uint256 quantity, 
    uint256 price, 
    bytes memory proof
  ) external payable nonReentrant {
    address recipient = _msgSender();
    //revert if the quantity being minted exceeds the max supply
    if ((totalSupply() + quantity) > MAX_SUPPLY
      //or if the admin did not approve of the price
      || !hasRole(_MINTER_ROLE, ECDSA.recover(
        ECDSA.toEthSignedMessageHash(
          keccak256(abi.encodePacked("publicmint", price))
        ),
        proof
      ))
      //or if what was sent is less than the price x quantity
      || msg.value < (price * quantity)
    ) revert InvalidCall();

    _safeMint(recipient, quantity);
  }

  /**
   * @dev Mints new tokens for the `recipient`. Its token ID will be 
   * automatically assigned. This is for WL mint and genesis.
   */
  function mint(
    address recipient,
    uint256 quantity, 
    uint256 price, 
    bytes memory proof
  ) external payable nonReentrant {
    //revert if the quantity being minted exceeds the max supply
    if ((totalSupply() + quantity) > MAX_SUPPLY
      //or if the admin did not approve of the price
      || !hasRole(_MINTER_ROLE, ECDSA.recover(
        ECDSA.toEthSignedMessageHash(
          keccak256(abi.encodePacked("wlmint", recipient, price))
        ),
        proof
      ))
      //or if what was sent is less than the price x quantity
      || msg.value < (price * quantity)
    ) revert InvalidCall();

    _safeMint(recipient, quantity);
  }

  // ============ Admin Methods ============

  /**
   * @dev Allows the _MINTER_ROLE to mint any to anyone (in the case of 
   * a no sell out)
   */
  function mint(
    address recipient,
    uint256 quantity
  ) external onlyRole(_MINTER_ROLE) {
    //the quantity being minted should not exceed the max supply
    if ((super.totalSupply() + quantity) > MAX_SUPPLY) 
      revert InvalidCall();

    _safeMint(recipient, quantity);
  }

  /**
   * @dev Sets the contract URI
   */
  function setBaseTokenURI(string memory uri) external onlyRole(_CURATOR_ROLE) {
    _baseTokenURI = uri;
  }

  /**
   * @dev Allows the proceeds to be withdrawn. This wont be allowed
   * until the metadata has been set to discourage rug pull
   */
  function withdraw(address recipient) external onlyOwner nonReentrant {
    //cannot withdraw without setting a base URI first
    if (bytes(_baseTokenURI).length == 0 ) revert InvalidCall();
    payable(recipient).transfer(address(this).balance);
  }
}