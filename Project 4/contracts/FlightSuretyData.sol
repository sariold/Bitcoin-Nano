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

    struct Airline {
        string name;
        bool registered;
        bool funded;
    }

    struct Flight {
        address airline;
        string key;
        bool registered;
        uint8 status;
        uint256 time;
    }

    struct Claim {
        address passenger;
        uint256 deposit;
    }

    mapping(address => bool) private authorizedMap;
    mapping(address => Airline) private airlineMap;
    mapping(bytes32 => Flight) private flightMap;
    mapping(bytes32 => Claim[]) private claimMap;
    mapping(address => uint256) public creditMap;

    uint256 private registeredAirlines = 0;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor() {
        contractOwner = msg.sender;
        authorizedMap[msg.sender] = true;
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
    modifier requireOperational() {
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

    modifier requireAuthorized() {
        require(authorizedMap[msg.sender] == true, "Caller is not authorized");
        _;
    }

    modifier requireAirlineRegistered(address airline) {
        require(
            airlineMap[airline].registered == true,
            "Airline is not registered"
        );
        _;
    }

    modifier requireAirlineFunded(address airline) {
        require(airlineMap[airline].funded == true, "Airline is not funded");
        _;
    }

    modifier requirePassengerCredits(address passenger) {
        require(creditMap[passenger] > 0, "Passenger has no available credits");
        _;
    }

    // modifier requireFlightRegistered(string flight) {
    //     require(flightMap[getFlightKey(airline, flight, timestamp);])
    // }

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

    function setAuthorization(address airline, bool authorized)
        external
        requireOperational
        requireContractOwner
    {
        authorizedMap[airline] = authorized;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(address airline, string memory name)
        external
        requireOperational
        requireAuthorized
    {
        airlineMap[airline] = Airline(name, true, false);
    }

    function isAirlineRegistered(address airline)
        external
        view
        requireOperational
        requireAuthorized
        returns (bool)
    {
        return airlineMap[airline].registered == true;
    }

    function fundAirline(address airline)
        external
        requireOperational
        requireAuthorized
    {
        airlineMap[airline].funded = true;
    }

    function isAirlineFunded(address airline)
        external
        view
        requireOperational
        requireAuthorized
        requireAirlineRegistered(airline)
        returns (bool)
    {
        return airlineMap[airline].funded == true;
    }

    function registerFlight(
        address airline,
        string memory flight,
        uint256 time
    )
        external
        requireOperational
        requireAuthorized
        requireAirlineRegistered(airline)
    {
        flightMap[getFlightKey(airline, flight, time)] = Flight(
            airline,
            flight,
            true,
            0,
            time
        );
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy(
        address airline,
        string memory flight,
        address passenger,
        uint256 deposit
    )
        external
        requireOperational
        requireAuthorized
        requireAirlineRegistered(airline)
        requireAirlineFunded(airline)
    {
        claimMap[keccak256(abi.encodePacked(airline, flight))].push(
            Claim(passenger, deposit)
        );
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees(
        address airline,
        string memory flight,
        uint256 multiplier
    ) external requireOperational requireAuthorized {
        bytes32 key = keccak256(abi.encodePacked(airline, flight));
        Claim[] memory insurees = claimMap[key];

        uint256 available;
        uint256 length = insurees.length;

        for (uint256 i = 0; i < length; i++) {
            available = creditMap[insurees[i].passenger];
            uint256 withdraw = (insurees[i].deposit.mul(multiplier).div(100));
            creditMap[insurees[i].passenger] = available.add(withdraw);
        }

        delete claimMap[key];
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay(address passenger)
        external
        requireOperational
        requireAuthorized
        requirePassengerCredits(passenger)
    {
        uint256 available = creditMap[passenger];
        creditMap[passenger] = 0;
        payable(passenger).transfer(available);
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund() public payable {}

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    fallback() external payable {}
}
