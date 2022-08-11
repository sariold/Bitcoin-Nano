pragma solidity >=0.4.21 <0.6.0;

// TODO define a contract call to the zokrates generated solidity contract <Verifier> or <renamedVerifier>
import "./ERC721Mintable.sol";
import "./Verifier.sol";

// TODO define another contract named SolnSquareVerifier that inherits from your ERC721Mintable class
// SquareVerifier,
contract SolnSquareVerifier is
    Verifier,
    ERC721Mintable("RealEstateToken", "RET")
{
    // TODO define a solutions struct that can hold a boolean value & an address
    struct Solution {
        bool inUse;
        address sender;
    }

    // TODO define an array of the above struct
    // Defined a mapping to store all Solution structs instead

    // TODO define a mapping to store unique solutions submitted
    mapping(bytes32 => Solution) private solutions;
    // TODO Create an event to emit when a solution is added
    event AddedSolution(bytes32 key, address sender);

    // TODO Create a function to add the solutions to the array and emit the event
    function addSolution(bytes32 key, address sender) internal {
        require(!solutions[key].inUse, "Solution is already in use");
        solutions[key].inUse = true;
        solutions[key].sender = sender;
        emit AddedSolution(key, sender);
    }

    // TODO Create a function to mint new NFT only after the solution has been verified
    //  - make sure the solution is unique (has not been used before)
    //  - make sure you handle metadata as well as tokenSupply
    function mintVerified(
        address to,
        uint256 tokenId,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[2] memory inputs
    ) public {
        bytes32 key = keccak256(abi.encodePacked(a, b, c, inputs));
        require(!solutions[key].inUse, "Solution is already in use");
        require(verifyTx(a, b, c, inputs), "Proof is not Zokrates valid");
        addSolution(key, msg.sender);
        mint(to, tokenId);
    }
}
