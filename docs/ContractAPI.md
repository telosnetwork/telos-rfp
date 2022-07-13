# Telos Works Contract API

## init()

Initialize the contract. Emplaces the config table.

## setversion()

Set a new contract version in the config table. Useful for tracking contract updates.

## setadmin()

Set a new admin account in the config table.

## setlckdtime()

Set the number of days TLOS rewarded will be locked before users can claim it.

## setmilestone()

Set the number of days each milestone will last. This value will be used when creating the milestones for the selected proposal.

## setbonusperc()

Set the extra bonus percentage that can be rewarded for the proposer when reviewing a report for a milestone.

## addmanager()

Add a new program manager.

## rmvmanager()

Remove a program manager. It can only be removed if he has not any active projects.

## adduserbl()

Add a user to the blacklist.

## rmvuserbl()

Remove a user from the blacklist.

## draftproject()

Create a new project. Transaction requires the authority of a program manager

## editproject()

Edit a project before it is published. 

## rmvproject()

Delete a project before it is published. 

## publishprjct()

Publishes a project to allow users to send proposals. Once this action is called, the proposing time starts.

## startproject() 

Starts the proposal execution once the voting process has ended and program manager has chosen the winner proposal. Milestones time begin at the moment this action is executed 
      
## endproject()

Ends a project after all milestones for the selected proposals has been completed and program manager has reviewed all of them.

## newproposal()

Creates a new proposal for an active project

## editproposal()

Edits a proposal for an active project during the proposing time

## rmvproposal() 

Deletes a proposal. It can be called until the voting process starts

## skipvoting()

Allows program manager to directly select proposals rewarded and proposal selected without voting.

## beginvoting()

Open a voting by the Telos community to select the best proposals for the project.

## endvoting()

Close out a community vote and render a final leaderboard table. The most voted proposals will be rewarded.

## pickproposal()

Selects a proposal between the ones that has been rewarded.

## sendreport()

Send report for a milestone.

## reviewreport()

Review a report for a milestone. If the milestone hasn't been sent on time, no rewards will be given.

## claimreward

Allows user to claim TLOS locked rewards.Can only be claimed after a year.
