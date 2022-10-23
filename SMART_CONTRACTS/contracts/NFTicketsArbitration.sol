// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./NFTicketsMarket.sol";
import "./NFTicketsTok.sol";
import "./NFTicketsTic.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// Custom Errors
error NoTicketForThisEvent(); // "You do not own a ticket for this event"
error CannotDisputeFinalizedEvent(); // "Can't submit a dispute after the event has been completed and paid"
error CannotDisputeEventBeforeStart(); // "Can't submit a dispute before the event has started"
error CannotDisputeFromThisFarAway(); // "Can't submit a dispute before the event has started"
error YouAlreadyDisputedThisEvent(); // "Can't submit a dispute before the event has started"
error DisputeDoesNotExist(); // "Can't submit a dispute before the event has started"
error InsuficientBalanceToVote(); // "Can't vote if you didn't hold at least 1 token at the time the dispute was raised"
error VotingFinished(); // "Voting finished 4 days after event finish time"
error InvalidChoice(); // "Votes can only be 1 = in buyer's favour or 2 = in seller's favour"
error InsificientDisputeEveidence(); //"Not enough disputes raised to warrant vote"
error NotEligible(); //
error AlreadyVoted();

contract NFTicketsArbitration is ReentrancyGuard, Ownable {

    NFTicketsMarket public MARKET;
    NFTicketsTok immutable TOKEN;
    NFTicketsTic public TICKET;
    uint256 constant internal DAY = 86400;
    int64 constant internal MAX_DISTANCE = 9000000000; // ~0.9 degrees at 10 decimals // ****** Didn't end up using this yet...

    constructor(address _token) {
        TOKEN = NFTicketsTok(_token);
    }
    
    struct Dispute {
        uint256 itemId;
        uint256 shapshotId;
        address[] disputers;
        int64[] disputerLat;
        int64[] disputerLon;
        uint256[] disputerTime;
        string[] disputerEvidence;
    } 

    struct Decision {
        address[] voter;
        uint8[] decision;
        uint8 outcome;
        bool processingStatus;
    }

    struct Voter {
        address voterAddress;
        uint256 balance;
    }

    uint256 public disputeIndex;
    uint256 public voterCount;
    uint256 public contractBalance;
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => Decision) public disputeToDecisions; // Maps decision for each dispute
    mapping(uint256 => Voter) public voterToBallance;

    // Sets market and ticket addresses

    function setUp (address _market, address _ticket) public onlyOwner {
        MARKET = NFTicketsMarket(_market);
        TICKET = NFTicketsTic(_ticket);
    }

    // Test function show decisions 
    function showDecision (uint256 _decision) public view returns (Decision memory) {
        return disputeToDecisions[_decision];
    }


    // ******* Need to add a payment for lodging dispute? *******
    function lodgeDispute(uint256 _itemId, int64 _disputerLat, int64 _disputerLon, uint256 _disputerTime, string memory _disputerEvidence) public nonReentrant {
        if(TICKET.balanceOf(msg.sender, MARKET.getTokenByMarketId(_itemId)) == 0) { revert NoTicketForThisEvent();}
        if((TICKET.getFinishTime(MARKET.getTokenByMarketId(_itemId)) - DAY) > block.timestamp) { revert CannotDisputeEventBeforeStart();}
        if((TICKET.getFinishTime(MARKET.getTokenByMarketId(_itemId)) + DAY) < block.timestamp) { revert CannotDisputeFinalizedEvent();}
        // **** need to check that the dispute is being raised within a reasonable distance from the event location ****
        // cycle through existing disputes to make sure  there isn't already one fo this item
        if(disputeIndex == 0) {
            disputes[disputeIndex].itemId = _itemId;
            disputes[disputeIndex].shapshotId = TOKEN.getSnapshot();
            disputes[disputeIndex].disputers.push(msg.sender);
            disputes[disputeIndex].disputerLat.push(_disputerLat);
            disputes[disputeIndex].disputerLon.push(_disputerLon);
            disputes[disputeIndex].disputerTime.push(_disputerTime);
            disputes[disputeIndex].disputerEvidence.push(_disputerEvidence);
            MARKET.changeStatus(_itemId, 2); // Changes status of the market item to In dispute (complaint raised)


            disputeIndex = disputeIndex + 1;
        } else {
            bool newDispute = false;
            for (uint i = 0; i < disputeIndex; i++){
                if(disputes[i].itemId == _itemId) { // if itemId matches existing dispute
                    for (uint j = 0; j < disputes[i].disputers.length; j++) {
                        if(disputes[i].disputers[j] == msg.sender) { revert YouAlreadyDisputedThisEvent();} // check to see if the message sender has altready disputed and if yes revert out
                    }
                    //if the item id matches but this is a different ticket purchaser disputing - add their details
                    disputes[i].disputers.push(msg.sender);
                    disputes[i].disputerLat.push(_disputerLat);
                    disputes[i].disputerLon.push(_disputerLon);
                    disputes[i].disputerTime.push(_disputerTime);
                    disputes[i].disputerEvidence.push(_disputerEvidence);
                } else {
                    newDispute = true;
                } 
            }  // if no dispute has been raised for this item add a new dispute
            if(newDispute == true) {
                disputes[disputeIndex].itemId = _itemId;
                disputes[disputeIndex].shapshotId = TOKEN.getSnapshot();
                disputes[disputeIndex].disputers.push(msg.sender);
                disputes[disputeIndex].disputerLat.push(_disputerLat);
                disputes[disputeIndex].disputerLon.push(_disputerLon);
                disputes[disputeIndex].disputerTime.push(_disputerTime);
                disputes[disputeIndex].disputerEvidence.push(_disputerEvidence);
                MARKET.changeStatus(_itemId, 2); // Changes status of the market item to In dispute (complaint raised)
                disputeIndex = disputeIndex + 1;
            }
        }
    }

    // Returns snapshotId of the dispute
    function getSnapshotOfDispute (uint256 _disputeId) public view returns (uint256) {
        if(_disputeId > disputeIndex) { revert DisputeDoesNotExist();}
        return disputes[_disputeId].shapshotId;
    }

    // Returns all details from a dispute
    function getDispute (uint256 _disputeId) public view returns (Dispute memory) {
        if(_disputeId > disputeIndex) { revert DisputeDoesNotExist();}
        return disputes[_disputeId];
    }

    // Captures votes from anyone with the balance to vote at the time of dispute being lodged
    // 1 = for buyer
    // 2 = for seller
    function vote (uint256 _disputeId, uint8 _choice) public nonReentrant {
        if(_disputeId > disputeIndex) { revert DisputeDoesNotExist();}
        if(disputes[_disputeId].itemId == 0) { revert DisputeDoesNotExist();}
        if((TICKET.getFinishTime(MARKET.getTokenByMarketId(disputes[_disputeId].itemId)) + (4 * DAY)) < block.timestamp) { revert VotingFinished();}
        if(disputeToDecisions[_disputeId].outcome == 2) { revert InsificientDisputeEveidence();}
        if(TOKEN.balanceOfAt(msg.sender, getSnapshotOfDispute(_disputeId)) < 1000000000000000000) { revert InsuficientBalanceToVote();}
        if(_choice == 0 || _choice > 2) { revert InvalidChoice();}
        bool existingDisputeVoter = false;
        uint256 voters = disputeToDecisions[_disputeId].voter.length;
        
        for (uint i = 0; i < (voters); i++){
            if (disputeToDecisions[_disputeId].voter[i] == msg.sender) {
                existingDisputeVoter = true;
            }
        }
        if (existingDisputeVoter == false){ 
            disputeToDecisions[_disputeId].voter.push(msg.sender);
            disputeToDecisions[_disputeId].decision.push(_choice);
            if(voterCount == 0) {
                voterToBallance[voterCount].voterAddress=msg.sender;
                voterCount = voterCount + 1;
            } else {
                bool existingVoter = false;
                for (uint i = 0; i < voterCount; i++){
                    if(voterToBallance[i].voterAddress == msg.sender) {
                        existingVoter = true;
                    } 
                }
                if(existingVoter == false) {
                    voterToBallance[voterCount].voterAddress=msg.sender;
                    voterCount = voterCount + 1;
                }
            }
        } else {
            revert AlreadyVoted();
        }
    }

    function checkVoterDecision (uint256 dispute, uint256 voter) public view returns (uint8) {
        return disputeToDecisions[dispute].decision[voter];
    }

    function votersLength (uint256 _disputeId) public view returns (uint256) {
        return disputeToDecisions[_disputeId].voter.length;
    }

    // Counts the votes when it's time to execute decisions
    function voteCount (uint256 _disputeId) public {
        if(_disputeId > disputeIndex) { revert DisputeDoesNotExist();}
        uint256 voters = disputeToDecisions[_disputeId].voter.length;
        uint256 votesForBuyer;
        uint256 votesForSeller;

        for (uint i = 0; i < voters; i++){
            if (disputeToDecisions[_disputeId].decision[i] == 1) {
                votesForBuyer = votesForBuyer + 1;
            } else {
                votesForSeller = votesForSeller +1;
            }
        }

        if (votesForBuyer > votesForSeller ) {
            disputeToDecisions[_disputeId].outcome = 1;
        } else {
            disputeToDecisions[_disputeId].outcome = 2;
        }
    }

    // this should be called by the keeper functionality
    // ***** need to make this executed by the keeper only ****
    function executeDecisions () public nonReentrant {
        for (uint i = 0; i < disputeIndex; i++) {
            voteCount(i);
            if (disputeToDecisions[i].processingStatus == false) {
                if (disputeToDecisions[i].outcome == 1) {
                    MARKET.changeStatus(disputes[i].itemId, 4); // in buyer's favour
                    MARKET.refundWithPenalty(disputes[i].itemId);
                } else {
                    MARKET.changeStatus(disputes[i].itemId, 3); // in seller's favour
                    MARKET.paySellers();
                }
                disputeToDecisions[i].processingStatus = true;
            }
        }
    }

    // this should be called by the keeper functionality
    // ***** need to make this executed by the keeper only ****
    function executeDecisionsWhenNeeded () public nonReentrant {
        for (uint i = 0; i < disputeIndex; i++) {
            if (disputeToDecisions[i].outcome == 0 || disputeToDecisions[i].outcome == 1) { // checks to see if the voting outcome so far is neutral/not voted or in favour of the buyer if yes proceeds to next check
                if ((TICKET.getFinishTime(MARKET.getTokenByMarketId(disputes[i].itemId)) + DAY) < block.timestamp) { // checks if one day has passed after sales have finished - if yes proceeds to next check
                    if (disputes[i].disputers.length <= ((MARKET.getTotalSalesByMarketId(disputes[i].itemId)) / 20)) { // ensures 5% dispute minimum is reached, if not, automatically rules in favour of seller as 5% disputes raised required for consideration
                        disputeToDecisions[i].outcome = 2;
                    } else {
                        voteCount(i);
                        if (disputeToDecisions[i].processingStatus == false) {
                            if (disputeToDecisions[i].outcome == 1) {
                                MARKET.changeStatus(disputes[i].itemId, 4); // in buyer's favour
                                MARKET.refundWithPenalty(disputes[i].itemId);
                            } else {
                                MARKET.changeStatus(disputes[i].itemId, 3); // in seller's favour
                                MARKET.paySellers();
                            }
                            disputeToDecisions[i].processingStatus = true;
                        }
                    }
                } 
            }
        }
    }

    // Owner functions: 

    // This needs to be triggered by the keeper on a timed basis
    // This one will receive 5% from the sales
    // ****** also need to test this works as right now it's only an internal function - change to public to test *******
    function executePaySellers() public {
        MARKET.paySellers();
    }

    function voterBalanceUpdate (uint256 _deposit) internal {
        //voterCount
        uint256 totalbalances;
        for (uint i = 0; i < voterCount; i++) {
            totalbalances = totalbalances + TOKEN.balanceOfAt(voterToBallance[i].voterAddress, TOKEN.getSnapshot());
        }
        
        for (uint i = 0; i < voterCount; i++) {
            voterToBallance[i].balance = voterToBallance[i].balance + (_deposit * (TOKEN.balanceOfAt(voterToBallance[i].voterAddress, TOKEN.getSnapshot())) / totalbalances);
        }
        contractBalance = contractBalance + _deposit;
    }

    function withdrawShare () public payable nonReentrant {
        //check that the msg sender is a voter
        if(isVoter(msg.sender) != true) { revert NotEligible();}
        uint256 currentShare;
        for (uint i = 0; i < voterCount; i++){
            if(voterToBallance[i].voterAddress == msg.sender) {
                currentShare = voterToBallance[i].balance;
                voterToBallance[i].balance = 0;
            } 
        }
        payable(msg.sender).transfer(currentShare);
    }

    function isVoter (address _check) internal view returns (bool) {
        bool existingVoter = false;
        for (uint i = 0; i < voterCount; i++){
            if(voterToBallance[i].voterAddress == _check) {
                existingVoter = true;
            } 
        }
        return existingVoter;
    }

    receive() external payable {
        //everytime money arrives, you get it distributed to all voters, as per their holdings at the current snapshot
        voterBalanceUpdate(msg.value);
    }

    fallback() external payable {
        //everytime money arrives, you get it distributed to all voters, as per their holdings at the current snapshot
        voterBalanceUpdate(msg.value);
    }
    
    // Everytime you vote, you get added to the list of voters, everytime money arrives, you get it distributed to all voters, as per their holdings at the current snapshot
}