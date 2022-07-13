const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Edit Proposal for Project Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosbuild = blockchain.createAccount("telosbuild");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");

    beforeAll(async () => {
        telosbuild.setContract(blockchain.contractTemplates[`telosbuild`]);
        telosbuild.updateAuth(`active`, `owner`, {
        accounts: [
            {
            permission: {
                actor: telosbuild.accountName,
                permission: `eosio.code`
            },
            weight: 1
            }
        ]
        });
    });

    beforeEach(async () => {
        telosbuild.resetTables();

        await telosbuild.loadFixtures("config", require("../fixtures/telosbuild/config.json"));
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 0,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 2,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [],
                    "proposal_selected": [],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "2001-01-01T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
        
        await telosbuild.loadFixtures("proposals", {
           "telosbuild": [{
                "proposal_id": "0",
                "project_id": "0",
                "status": "1",
                "title": "Title",
                "proposer": "user2",
                "timeline": "timeline",
                "number_milestones": 5,
                "tech_qualifications_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "approach_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "cost_and_schedule_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "references_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "usd_amount": "10.0000 USD",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })
    });

    it("edit proposal", async () => {
        expect.assertions(1)
        await telosbuild.contract.editproposal(
            {
                proposal_id: "0",
                title: "Title",
                number_milestones: 5,
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_amount: "100.0000 USD",
                mockups_link: "New mockups_link",
                kanban_board_link: "New kanban_board_link",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }]);
        
        const proposals = telosbuild.getTableRowsScoped("proposals");
        expect(proposals).toEqual({
            "telosbuild": [{
                "proposal_id": "0",
                "project_id": "0",
                "status": 1,
                "title": "Title",
                "proposer": "user2",
                "timeline": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "number_milestones": "5",
                "tech_qualifications_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "approach_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "cost_and_schedule_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "references_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "usd_amount": "100.0000 USD",
                "mockups_link": "New mockups_link",
                "kanban_board_link": "New kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })
    });


    it("Fails to edit proposal if project doesn't exist", async () => {
        await expect(telosbuild.contract.editproposal(
            {
                proposal_id: "1",
                title: "Title",
                number_milestones: 5,
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_amount: "100.0000 USD",
                mockups_link: "New mockups_link",
                kanban_board_link: "New kanban_board_link",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("Proposal not found");
    });

    it("Fails to edit proposal if timeline isn't valid", async () => {
        await expect(telosbuild.contract.editproposal(
            {
                proposal_id: "0",
                title: "Title",
                number_milestones: 5,
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_amount: "100.0000 USD",
                mockups_link: "New mockups_link",
                kanban_board_link: "New kanban_board_link",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("invalid ipfs string, valid schema: <hash>");
    });

    it("Fails to edit proposal if tech qualifications isn't valid", async () => {
        await expect(telosbuild.contract.editproposal(
            {
                proposal_id: "0",
                title: "Title",
                number_milestones: 5,
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_amount: "100.0000 USD",
                mockups_link: "New mockups_link",
                kanban_board_link: "New kanban_board_link",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("invalid ipfs string, valid schema: <hash>");
    });

    it("Fails to edit proposal if approach pdf isn't valid", async () => {
        await expect(telosbuild.contract.editproposal(
            {
                proposal_id: "0",
                title: "Title",
                number_milestones: 5,
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXUodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_amount: "100.0000 USD",
                mockups_link: "New mockups_link",
                kanban_board_link: "New kanban_board_link",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("invalid ipfs string, valid schema: <hash>");
    });

    it("Fails to edit proposal if cost and schedule pdf isn't valid", async () => {
        await expect(telosbuild.contract.editproposal(
            {
                proposal_id: "0",
                title: "Title",
                number_milestones: 5,
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTt01TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_amount: "100.0000 USD",
                mockups_link: "New mockups_link",
                kanban_board_link: "New kanban_board_link",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("invalid ipfs string, valid schema: <hash>");
    });

    it("Fails to edit proposal if references pdf pdf isn't valid", async () => {
        await expect(telosbuild.contract.editproposal(
            {
                proposal_id: "0",
                title: "Title",
                number_milestones: 5,
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_amount: "100.0000 USD",
                mockups_link: "New mockups_link",
                kanban_board_link: "New kanban_board_link",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("invalid ipfs string, valid schema: <hash>");
    });
    


    it("fails to edit a proposal if project isn't in published state", async () => {
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 3,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [],
                    "proposal_selected": [],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "2001-01-01T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });

        await telosbuild.loadFixtures("proposals", {
           "telosbuild": [{
                "proposal_id": "1",
                "project_id": "1",
                "status": "1",
                "title": "Title",
                "proposer": "user2",
                "timeline": "timeline",
                "number_milestones": 5,
                "tech_qualifications_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "approach_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "cost_and_schedule_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "references_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "usd_amount": "10.0000 USD",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })
        
        await expect(telosbuild.contract.editproposal(
            {
                proposal_id: "1",
                title: "Title",
                number_milestones: 5,
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_amount: "100.0000 USD",
                mockups_link: "New mockups_link",
                kanban_board_link: "New kanban_board_link",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("Project must be published to edit proposals.");
    })

    it("fails to edit a proposal if proposal is not in drafting mode", async () => {        
        await telosbuild.loadFixtures("proposals", {
           "telosbuild": [{
                "proposal_id": "1",
                "project_id": "0",
                "status": "3",
                "title": "Title",
                "proposer": "user2",
                "timeline": "timeline",
                "number_milestones": 5,
                "tech_qualifications_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "approach_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "cost_and_schedule_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "references_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "usd_amount": "10.0000 USD",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })
        
        await expect(telosbuild.contract.editproposal(
            {
                proposal_id: "1",
                title: "Title",
                number_milestones: 5,
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_amount: "100.0000 USD",
                mockups_link: "New mockups_link",
                kanban_board_link: "New kanban_board_link",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("Proposal needs to be in drafting status to be edited");
    })

     it("fails to edit a proposal if proposing time has ended", async () => {
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 2,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [],
                    "proposal_selected": [],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "1999-01-01T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
         
        await telosbuild.loadFixtures("proposals", {
           "telosbuild": [{
                "proposal_id": "1",
                "project_id": "1",
                "status": "1",
                "title": "Title",
                "proposer": "user2",
                "timeline": "timeline",
                "number_milestones": 5,
                "tech_qualifications_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "approach_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "cost_and_schedule_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "references_pdf": "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                "usd_amount": "10.0000 USD",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })
        
        await expect(telosbuild.contract.editproposal(
            {
                proposal_id: "1",
                title: "Title",
                number_milestones: 5,
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_amount: "100.0000 USD",
                mockups_link: "New mockups_link",
                kanban_board_link: "New kanban_board_link",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("Proposing time has expired, cannot edit proposals.");
    })

    it("fails to edit a proposal if usd rewarded symbol isn't valid", async () => {
       await expect(telosbuild.contract.editproposal(
            {
               proposal_id: "0",
                title: "Title",
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                number_milestones: 5,
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_amount: "250.0000 TLOS",
                mockups_link: "New mockups_link",
                kanban_board_link: "New kanban_board_link",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])
        ).rejects.toThrow("asset has to be USD and greater than zero");
    })

    it("fails to edit a proposal if usd rewarded amount isn't valid", async () => {
        await expect(telosbuild.contract.editproposal(
            {
                proposal_id: "0",
                title: "Title",
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                number_milestones: 5,
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_amount: "0.0000 USD",
                mockups_link: "New mockups_link",
                kanban_board_link: "New kanban_board_link",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])
        ).rejects.toThrow("asset has to be USD and greater than zero");
    });



    it("fails to edit proposal if user that isn't the proposer tries it", async () => {
        await expect(telosbuild.contract.editproposal(
            {
                proposal_id: "0",
                title: "Title",
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                number_milestones: 5,
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                usd_amount: "0.0000 USD",
                mockups_link: "New mockups_link",
                kanban_board_link: "New kanban_board_link",
            },
            [{
                actor: admin.accountName,
                permission: "active"
            }])
        ).rejects.toThrow();
    })

});