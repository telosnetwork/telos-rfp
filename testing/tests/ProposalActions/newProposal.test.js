const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("New Proposal for Project Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosbuild = blockchain.createAccount("telosbuild");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let user3 = blockchain.createAccount("user3");

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

        await telosbuild.loadFixtures("profiles", {
            "telosbuild": [
                {
                    "account": "user2",
                    "tlos_balance": "100.0000 TLOS",
                    "locked_tlos_balance": "0.0000 TLOS",
                    "locked_tlos_bonds": "0.0000 TLOS"
                }
            ]
        })

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
    });

    it("new proposal", async () => {
        expect.assertions(3)
        await telosbuild.contract.newproposal(
            {
                project_id: "0",
                proposer: "user2",
                title: "Title",
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                number_milestones: 5,
                usd_amount: "10.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
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
                "usd_amount": "10.0000 USD",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })

        const profiles = telosbuild.getTableRowsScoped("profiles")["telosbuild"];
        expect(profiles.find(prof => prof.account === "user2")).toEqual({
            account: "user2",
            tlos_balance: "90.0000 TLOS",
            locked_tlos_balance: "0.0000 TLOS",
            locked_tlos_bonds: "10.0000 TLOS",
        });

        const config = telosbuild.getTableRowsScoped("config")["telosbuild"][0];
        expect(config.reserved_funds).toEqual("10.0000 TLOS");
    });

    it("Fails if proposer doens't have enough funds", async () => {
        await expect(telosbuild.contract.newproposal(
            {
                project_id: "0",
                title: "Title",
                proposer: "user1",
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                number_milestones: 5,
                usd_amount: "10.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow("Proposer doesn't have enough funds");
    });

    it("Fails to create proposal if project doesn't exist", async () => {
        await expect(telosbuild.contract.newproposal(
            {
                project_id: "2",
                title: "Title",
                proposer: "user2",
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                number_milestones: 5,
                usd_amount: "10.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("Project not found");
    });

    it("Fails to create proposal if timeline hash isn't valid", async () => {
        await expect(telosbuild.contract.newproposal(
            {
                project_id: "0",
                title: "Title",
                proposer: "user2",
                timeline: "QmTtDqW001TXdLNjpcpQQCXhLiQXi6wZvKd5gj7",
                number_milestones: 5,
                usd_amount: "10.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("invalid ipfs string, valid schema: <hash>");
    });

    it("Fails to create proposal if tech qualifications hash isn't valid", async () => {
        await expect(telosbuild.contract.newproposal(
            {
                project_id: "0",
                title: "Title",
                proposer: "user2",
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                number_milestones: 5,
                usd_amount: "10.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
                tech_qualifications_pdf: "QmTtD1TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("invalid ipfs string, valid schema: <hash>");
    });

    it("Fails to create proposal if approach pdf hash isn't valid", async () => {
        await expect(telosbuild.contract.newproposal(
            {
                project_id: "0",
                title: "Title",
                proposer: "user2",
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                number_milestones: 5,
                usd_amount: "10.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pfjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("invalid ipfs string, valid schema: <hash>");
    });

    it("Fails to create proposal if cost and schedule pdf hash isn't valid", async () => {
        await expect(telosbuild.contract.newproposal(
            {
                project_id: "0",
                title: "Title",
                proposer: "user2",
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                number_milestones: 5,
                usd_amount: "10.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqWpf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("invalid ipfs string, valid schema: <hash>");
    });

    it("Fails to create proposal if references pdf hash isn't valid", async () => {
        await expect(telosbuild.contract.newproposal(
            {
                project_id: "0",
                title: "Title",
                proposer: "user2",
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                number_milestones: 5,
                usd_amount: "10.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW00f2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("invalid ipfs string, valid schema: <hash>");
    });


    it("fails to create a proposal if project isn't in published state", async () => {
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 1,
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
                    "propose_end_ts": "1970-01-01T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
        
        await expect(telosbuild.contract.newproposal(
            {
                project_id: "1",
                title: "Title",
                proposer: "user2",
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                number_milestones: 5,
                usd_amount: "10.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("Project must be published to accept proposals.");
    })

     it("fails to create a proposal if proposing time has ended", async () => {
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
                    "propose_end_ts": "1970-01-01T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
        
        await expect(telosbuild.contract.newproposal(
            {
                project_id: "1",
                proposer: "user2",
                title: "Title",
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                number_milestones: 5,
                usd_amount: "10.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("Proposing time has expired, cannot add new proposals.");
    })

    it("fails to create new proposal if usd rewarded symbol isn't valid", async () => {
        await expect(telosbuild.contract.newproposal(
            {
                project_id: "0",
                proposer: "user2",
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                title: "Title",
                number_milestones: 5,
                usd_amount: "10.0000 TLOS",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("asset has to be USD and greater than zero");
    })

    it("fails to create new proposal if usd rewarded amount isn't valid", async () => {
        await expect(telosbuild.contract.newproposal(
            {
                project_id: "0",
                proposer: "user2",
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                title: "Title",
                number_milestones: 5,
                usd_amount: "0.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("asset has to be USD and greater than zero");
    })


    it("fails to create proposal if user is not in the system", async () => {
        await expect(telosbuild.contract.newproposal(
            {
                project_id: "0",
                proposer: "user3",
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                title: "Title",
                number_milestones: 5,
                usd_amount: "0.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
            },
            [{
                actor: user3.accountName,
                permission: "active"
            }])).rejects.toThrow();
    })

    it("fails to create proposal if user that isn't the proposer tries it", async () => {
        await expect(telosbuild.contract.newproposal(
            {
                project_id: "0",
                proposer: "user2",
                timeline: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                title: "Title",
                number_milestones: 5,
                usd_amount: "0.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
                tech_qualifications_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                approach_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                cost_and_schedule_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
                references_pdf: "QmTtDqW001TXU7pf2PodLNjpcpQQCXhLiQXi6wZvKd5gj7",
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow();
    })

});