const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Send Report Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosworks = blockchain.createAccount("telosworks");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let eosiotoken = blockchain.createAccount("eosio.token");

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

        eosiotoken.setContract(blockchain.contractTemplates["eosio.token"]);
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
                    "ballot_name": "ballot",
                    "status": 6,
                    "build_director": "user1",
                    "description": "description",
                    "github_url": "url",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [0,1],
                    "proposal_selected": [0],
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

        await telosworks.loadFixtures("proposals", {
           "": [{
                "proposal_id": "0",
                "proposer": "user2",
                "timeline": "timeline",
                "number_milestones": 5,
                "pdf": "pdf",
                "usd_amount": "10.0000 USD",
                "locked_tlos_amount": "20.0000 TLOS",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })

        await telosworks.loadFixtures("milestones", {
            "": [
                {
                    "milestone_id": 0,
                    "status": 1,
                    "tlos_rewarded": "3.0000 TLOS",
                    "title": "Title",
                    "description": "description",
                    "documents": "documents",
                    "start_ts": "1999-01-11T00:00:00.000",
                    "end_ts": "2000-01-21T00:00:00.000",
                    "send_ts": "2000-01-16T00:00:00.000",
                    "review_ts": "2000-01-22T00:00:00.000",
                }
            ]
        });
    });

    it("Send report succeeds", async () => { 
        expect.assertions(1);

        await telosworks.contract.sendreport({
            project_id: 0,
            milestone_id: 0,
            title: "Title",
            description: "Description",
            documents: "Documents"
        }, [
            {
                actor: user2.accountName,
                permission: "active"
            }
        ])

        const milestones = telosworks.getTableRowsScoped("milestones")[""];
        expect(milestones.find(mls => mls.milestone_id == 0)).toEqual({
            "description": "Description",
            "documents": "Documents",
            "end_ts": "2000-01-21T00:00:00.000",
            "milestone_id": "0",
            "review_ts": "2000-01-22T00:00:00.000",
            "send_ts": "2000-01-01T00:00:00.000",
            "start_ts": "1999-01-11T00:00:00.000",
            "status": 2,
            "title": "Title",
            "tlos_rewarded": "3.0000 TLOS",
        }
);
    });

    it("fails if project not found", async () => { 
        await expect(telosworks.contract.sendreport({
            project_id: 24,
            milestone_id: 0,
            title: "Title",
            description: "Description",
            documents: "Documents"
        }, [
            {
                actor: user2.accountName,
                permission: "active"
            }
        ])).rejects.toThrow("Project not found");
    });

    it("fails if project is not in started state", async () => { 
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "ballot",
                    "status": 4,
                    "build_director": "user1",
                    "description": "description",
                    "github_url": "url",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [0,1],
                    "proposal_selected": [0],
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

        await telosworks.loadFixtures("proposals", {
           "............1": [{
                "proposal_id": "0",
                "proposer": "user2",
                "timeline": "timeline",
                "number_milestones": 5,
                "pdf": "pdf",
                "usd_amount": "10.0000 USD",
                "locked_tlos_amount": "0.0000 TLOS",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })

        await telosworks.loadFixtures("milestones", {
            "............1": [
                {
                    "milestone_id": 0,
                    "status": 1,
                    "tlos_rewarded": "3.0000 TLOS",
                    "title": "Title",
                    "description": "description",
                    "documents": "documents",
                    "start_ts": "1999-01-11T00:00:00.000",
                    "end_ts": "2000-01-21T00:00:00.000",
                    "send_ts": "2000-01-16T00:00:00.000",
                    "review_ts": "2000-01-22T00:00:00.000",
                }
            ]
        });

        await expect(telosworks.contract.sendreport({
            project_id: 1,
            milestone_id: 0,
            title: "Title",
            description: "Description",
            documents: "Documents"
        }, [
            {
                actor: user2.accountName,
                permission: "active"
            }
        ])).rejects.toThrow("Project is not in started status, cannot update milestones");
    });

    
    it("fails if milestone id is not found", async () => { 
        await expect(telosworks.contract.sendreport({
            project_id: 0,
            milestone_id: 4,
            title: "Title",
            description: "Description",
            documents: "Documents"
        }, [
            {
                actor: user2.accountName,
                permission: "active"
            }
        ])).rejects.toThrow("Milestone not found");
    });

      
    it("fails if milestone report has been already sent", async () => { 
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "ballot",
                    "status": 6,
                    "build_director": "user1",
                    "description": "description",
                    "github_url": "url",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [0,1],
                    "proposal_selected": [0],
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

        await telosworks.loadFixtures("proposals", {
           "............1": [{
                "proposal_id": "0",
                "proposer": "user2",
                "timeline": "timeline",
                "number_milestones": 5,
                "pdf": "pdf",
                "usd_amount": "10.0000 USD",
                "locked_tlos_amount": "0.0000 TLOS",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })

        await telosworks.loadFixtures("milestones", {
            "............1": [
                {
                    "milestone_id": 0,
                    "status": 2,
                    "tlos_rewarded": "3.0000 TLOS",
                    "title": "Title",
                    "description": "description",
                    "documents": "documents",
                    "start_ts": "1999-01-11T00:00:00.000",
                    "end_ts": "2000-01-21T00:00:00.000",
                    "send_ts": "2000-01-16T00:00:00.000",
                    "review_ts": "2000-01-22T00:00:00.000",
                }
            ]
        });

        await expect(telosworks.contract.sendreport({
            project_id: 1,
            milestone_id: 0,
            title: "Title",
            description: "Description",
            documents: "Documents"
        }, [
            {
                actor: user2.accountName,
                permission: "active"
            }
        ])).rejects.toThrow("A report has already been sent.");
    });

      
    it("fails if trying to send a milestone before it starts", async () => {
        await telosworks.loadFixtures("projects", {
            "telosworks": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "ballot",
                    "status": 6,
                    "build_director": "user1",
                    "description": "description",
                    "github_url": "url",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [0,1],
                    "proposal_selected": [0],
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

        await telosworks.loadFixtures("proposals", {
           "............1": [{
                "proposal_id": "0",
                "proposer": "user2",
                "timeline": "timeline",
                "number_milestones": 5,
                "pdf": "pdf",
                "usd_amount": "10.0000 USD",
                "locked_tlos_amount": "0.0000 TLOS",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })

        await telosworks.loadFixtures("milestones", {
            "............1": [
                {
                    "milestone_id": 0,
                    "status": 1,
                    "tlos_rewarded": "3.0000 TLOS",
                    "title": "Title",
                    "description": "description",
                    "documents": "documents",
                    "start_ts": "2004-01-11T00:00:00.000",
                    "end_ts": "2000-01-21T00:00:00.000",
                    "send_ts": "2000-01-16T00:00:00.000",
                    "review_ts": "2000-01-22T00:00:00.000",
                }
            ]
        });
       

        await expect(telosworks.contract.sendreport({
            project_id: 1,
            milestone_id: 0,
            title: "Title",
            description: "Description",
            documents: "Documents"
        }, [
            {
                actor: user2.accountName,
                permission: "active"
            }
        ])).rejects.toThrow("Cannot send a report before the milestone starts");
    });

    it("fails if user other than project_manager tries to review report", async () => { 
         await expect(telosworks.contract.sendreport({
            project_id: 0,
            milestone_id: 0,
            title: "Title",
            description: "Description",
            documents: "Documents"
        }, [
            {
                actor: user1.accountName,
                permission: "active"
            }
        ])).rejects.toThrow();
    });

});