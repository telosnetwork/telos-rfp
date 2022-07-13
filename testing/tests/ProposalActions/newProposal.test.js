const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("New Proposal for Project Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosworks = blockchain.createAccount("telosworks");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let user3 = blockchain.createAccount("user3");

    beforeAll(async () => {
        telosworks.setContract(blockchain.contractTemplates[`telosworks`]);
        telosworks.updateAuth(`active`, `owner`, {
        accounts: [
            {
            permission: {
                actor: telosworks.accountName,
                permission: `eosio.code`
            },
            weight: 1
            }
        ]
        });
    });

    beforeEach(async () => {
        telosworks.resetTables();

        await telosworks.loadFixtures("config", require("../fixtures/telosworks/config.json"));
        await telosworks.loadFixtures("profiles", require("../fixtures/telosworks/profiles.json"));
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 0,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 2,
                    "build_director": "user1",
                    "description": "description",
                    "github_url": "url",
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
        expect.assertions(1)
        await telosworks.contract.newproposal(
            {
                project_id: "0",
                proposer: "user2",
                timeline: "timeline",
                number_milestones: 5,
                pdf: "pdf",
                usd_amount: "10.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }]);
        
        

        const proposals = telosworks.getTableRowsScoped("proposals");
        expect(proposals).toEqual({
            "": [{
                "proposal_id": "0",
                "proposer": "user2",
                "timeline": "timeline",
                "number_milestones": "5",
                "pdf": "pdf",
                "usd_amount": "10.0000 USD",
                "locked_tlos_amount": "0.0000 TLOS",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })
    });

     it("Fails to create proposal if project doesn't exist", async () => {
        await expect(telosworks.contract.newproposal(
            {
                project_id: "2",
                proposer: "user2",
                timeline: "timeline",
                number_milestones: 5,
                pdf: "pdf",
                usd_amount: "10.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("Project not found");
    });

    it("fails to create a proposal if project isn't in published state", async () => {
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 1,
                    "build_director": "user1",
                    "description": "description",
                    "github_url": "url",
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
        
        await expect(telosworks.contract.newproposal(
            {
                project_id: "1",
                proposer: "user2",
                timeline: "timeline",
                number_milestones: 5,
                pdf: "pdf",
                usd_amount: "10.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("Project must be published to accept proposals.");
    })

     it("fails to create a proposal if proposing time has ended", async () => {
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 2,
                    "build_director": "user1",
                    "description": "description",
                    "github_url": "url",
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
        
        await expect(telosworks.contract.newproposal(
            {
                project_id: "1",
                proposer: "user2",
                timeline: "timeline",
                number_milestones: 5,
                pdf: "pdf",
                usd_amount: "10.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("Proposing time has expired, cannot add new proposals.");
    })

    it("fails to create new proposal if usd rewarded symbol isn't valid", async () => {
        await expect(telosworks.contract.newproposal(
            {
                project_id: "0",
                proposer: "user2",
                timeline: "timeline",
                number_milestones: 5,
                pdf: "pdf",
                usd_amount: "10.0000 TLOS",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("asset has to be USD and greater than zero");
    })

    it("fails to create new proposal if usd rewarded amount isn't valid", async () => {
        await expect(telosworks.contract.newproposal(
            {
                project_id: "0",
                proposer: "user2",
                timeline: "timeline",
                number_milestones: 5,
                pdf: "pdf",
                usd_amount: "0.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
            },
            [{
                actor: user2.accountName,
                permission: "active"
            }])).rejects.toThrow("asset has to be USD and greater than zero");
    })


    it("fails to create proposal if user is not in the system", async () => {
        await expect(telosworks.contract.newproposal(
            {
                project_id: "0",
                proposer: "user3",
                timeline: "timeline",
                number_milestones: 5,
                pdf: "pdf",
                usd_amount: "0.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
            },
            [{
                actor: user3.accountName,
                permission: "active"
            }])).rejects.toThrow();
    })

    it("fails to create proposal if user that isn't the proposer tries it", async () => {
        await expect(telosworks.contract.newproposal(
            {
                project_id: "0",
                proposer: "user2",
                timeline: "timeline",
                number_milestones: 5,
                pdf: "pdf",
                usd_amount: "0.0000 USD",
                mockups_link: "mockups_link",
                kanban_board_link: "kanban_board_link",
            },
            [{
                actor: user1.accountName,
                permission: "active"
            }])).rejects.toThrow();
    })

});