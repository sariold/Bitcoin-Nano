// SPDX-License-Identifier: MIT
pragma solidity >=0.8.15;

import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false
    uint256 private multiplier = 150;

    struct Airline {
        bool isRegistered;
        bool isFunded;
        uint256 wallet;
    }

    struct Flight {
        address airline;
        bool isRegistered;
        bytes32 key;
        string number;
        uint8 status;
        uint256 time;
    }

    struct Claim {
        address insuree;
        uint256 deposit;
        bool paid;
    }

    uint256 registeredAirlinesAmount = 0;
    uint256 fundedAirlinesAmount = 0;
    mapping(address => Airline) private airlines;

    mapping(bytes32 => Flight) public flights;
    bytes32[] public registeredFlights;

    mapping(bytes32 => Claim[]) public claims;
    mapping(address => uint256) public funds;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event AirlineRegistered(address airline);
    event AirlineFunded(address airline);
    event FlightRegistered(bytes32 flight);
    event FlightProcessed(bytes32 flight, uint8 status);
    event PassengerInsured(address passenger, bytes32 flight, uint256 deposit);
    event PassengerCredited(address passenger, bytes32 flight, uint256 credit);
    event PassengerPaid(address passenger, uint256 amount);

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor() {
        contractOwner = msg.sender;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
     * @dev Modifier that requires the "Airline" account to not be registered
     */
    modifier requireAirlineNotRegistered(address airline) {
        require(!airlines[airline].isRegistered, "Airline is registered");
        _;
    }

    /**
     * @dev Modifier that requires the "Airline" account to not be funded
     */
    modifier requireAirlineNotFunded(address airline) {
        require(!airlines[airline].isFunded, "Airline is funded");
        _;
    }

    /**
     * @dev Modifier that requires the "Flight" to not be registered
     */
    modifier requireFlightNotRegistered(bytes32 key) {
        require(!flights[key].isRegistered, "Flight is registered");
        _;
    }

    /**
     * @dev Modifier that requires the "Airline" account to be registered
     */
    modifier requireAirlineRegistered(address airline) {
        require(airlines[airline].isRegistered, "Airline is not registered");
        _;
    }

    /**
     * @dev Modifier that requires the "Airline" account to be funded
     */
    modifier requireAirlineFunded(address airline) {
        require(airlines[airline].isFunded, "Airline is not funded");
        _;
    }

    /**
     * @dev Modifier that requires the "Flight" to be registered
     */
    modifier requireFlightRegistered(bytes32 key) {
        require(flights[key].isRegistered, "Flight is not registered");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() public view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(address airline)
        external
        requireIsOperational
        requireAirlineNotRegistered(airline)
        requireAirlineNotFunded(airline)
    {
        airlines[airline] = Airline(true, false, 0);
        registeredAirlinesAmount = registeredAirlinesAmount.add(1);
        emit AirlineRegistered(airline);
    }

    function registerFlight(
        address airline,
        bytes32 key,
        string memory number,
        uint256 time
    )
        public
        payable
        requireIsOperational
        requireAirlineFunded(airline)
        requireFlightNotRegistered(key)
    {
        flights[key] = Flight(airline, true, key, number, 0, time);
        registeredFlights.push(key);
        emit FlightRegistered(key);
    }

    function getRegisteredFlightsAmount()
        public
        view
        requireIsOperational
        returns (uint256)
    {
        return registeredFlights.length;
    }

    /**
     * @dev Check if an airline is registered
     * @return bool if an airline is registered
     */
    function getAirlineRegistered(address airline)
        public
        view
        requireIsOperational
        returns (bool)
    {
        return airlines[airline].isRegistered;
    }

    function getFlightRegistered(bytes32 key) public view returns (bool) {
        return flights[key].isRegistered;
    }

    function getFlightGrounded(bytes32 key) public view returns (bool) {
        return flights[key].status > 0;
    }

    function getPassengerInsuredFlight(address passenger, bytes32 key)
        public
        view
        returns (bool)
    {
        Claim[] memory flightClaims = claims[key];
        uint256 length = flightClaims.length;
        for (uint256 i = 0; i < length; i++) {
            if (flightClaims[i].insuree == passenger) return true;
        }
        return false;
    }

    /**
     * @dev Check if an airline is funded
     * @return bool if an airline is funded
     */
    function getAirlineFunded(address airline) public view returns (bool) {
        return airlines[airline].isFunded;
    }

    function getRegisteredAirlinesAmount()
        public
        view
        requireIsOperational
        returns (uint256)
    {
        return registeredAirlinesAmount;
    }

    function getFundedAirlinesAmount()
        public
        view
        requireIsOperational
        returns (uint256)
    {
        return fundedAirlinesAmount;
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function setFlightStatus(
        address airline,
        string calldata flight,
        uint256 time,
        uint8 status
    ) external requireIsOperational {
        bytes32 key = getFlightKey(airline, flight, time);
        require(!getFlightGrounded(key), "Flight is grounded.");
        if (flights[key].status == 0) {
            flights[key].status = status;
            if (status == 20) {
                creditInsurees(key);
            }
        }
        emit FlightProcessed(key, status);
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy(
        bytes32 key,
        address insuree,
        uint256 deposit
    ) external payable requireIsOperational {
        require(getFlightRegistered(key), "Flight registered");
        require(!getFlightGrounded(key), "Flight grounded");

        claims[key].push(Claim(insuree, deposit, false));
        emit PassengerInsured(insuree, key, deposit);
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees(bytes32 key) internal requireIsOperational {
        uint256 length = claims[key].length;
        for (uint256 i = 0; i < length; i++) {
            Claim memory claim = claims[key][i];
            claim.paid = true;
            uint256 amount = claim.deposit.mul(multiplier).div(100);
            funds[claim.insuree] = funds[claim.insuree].add(amount);
            emit PassengerCredited(claim.insuree, key, amount);
        }
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay(address payable passenger)
        external
        payable
        requireIsOperational
    {
        uint256 amount = funds[passenger];
        require(
            address(this).balance >= amount,
            "Contract does not have enough funds"
        );
        require(amount > 0, "Passenger has no funds to withdraw");
        funds[passenger] = 0;
        payable(address(uint160(address(passenger)))).transfer(amount);
        emit PassengerPaid(passenger, amount);
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund(address airline, uint256 deposit)
        external
        requireIsOperational
        requireAirlineRegistered(airline)
        requireAirlineNotFunded(airline)
        returns (bool)
    {
        airlines[airline].isFunded = true;
        airlines[airline].wallet = airlines[airline].wallet.add(deposit);
        fundedAirlinesAmount = fundedAirlinesAmount.add(1);
        emit AirlineFunded(airline);
        return airlines[airline].isFunded;
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    fallback() external payable {}
}
