const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Review Report Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosworks = blockchain.createAccount("telosworks");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let delphioracle = blockchain.createAccount("delphioracle");

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

        delphioracle.setContract(blockchain.contractTemplates["delphioracle"]);

        await delphioracle.loadFixtures();
    });

    beforeEach(async () => {
        telosworks.resetTables();

        await telosworks.loadFixtures("config", require("../fixtures/telosworks/config.json"));
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

        await telosworks.loadFixtures("milestones", {
            "": [
                {
                    "milestone_id": 0,
                    "status": 2,
                    "tlos_rewarded": "3.0000 TLOS",
                    "title": "Title",
                    "description": "description",
                    "documents": "documents",
                    "start_ts": "1999-01-11T00:00:00.000",
                    "end_ts": "1999-12-31T00:00:00.000",
                    "send_ts": "1999-01-16T00:00:00.000",
                    "review_ts": "2000-01-22T00:00:00.000",
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
                "locked_tlos_amount": "25.0000 TLOS",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })
    });

    it("Review report succeeds", async () => { 
        expect.assertions(5);

        await telosworks.contract.reviewreport({
            project_id: 0,
            milestone_id: 0,
            pay_reward: true,
            bonus: true,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }]);


        const conf = telosworks.getTableRowsScoped("config")["telosworks"][0];
        expect(conf.reserved_funds).toEqual("2.5000 TLOS");
        expect(conf.available_funds).toEqual("47.5000 TLOS");

        const profiles = telosworks.getTableRowsScoped("profiles")["telosworks"];
        expect(profiles.find(prof => prof.account === "user2").tlos_balance).toEqual("2.5000 TLOS");

        const milestones = telosworks.getTableRowsScoped("milestones")[""];
        expect(milestones.find(mls => mls.milestone_id == 0)).toEqual({
            "milestone_id": "0",
            "status": 3,
            "tlos_rewarded": "2.5000 TLOS",
            "title": "Title",
            "description": "description",
            "documents": "documents",
            "start_ts": "1999-01-11T00:00:00.000",
            "end_ts": "1999-12-31T00:00:00.000",
            "send_ts": "1999-01-16T00:00:00.000",
            "review_ts": "2000-01-01T00:00:00.000",
        });

        const lockedtlos = telosworks.getTableRowsScoped("lockedtlos")["user2"][0];
        expect(lockedtlos).toEqual({
            locked_id: "0",
            tlos_amount: "2.5000 TLOS",
            locked_until_ts: "2000-12-31T00:00:00.000"
        })

       

    });

    it("fails if project not found", async () => { 
        await expect(telosworks.contract.reviewreport({
            project_id: 24,
            milestone_id: 0,
            pay_reward: false,
            bonus: false,
        }, [
            {
                actor: user1.accountName,
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
                    "status": 3,
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
                    "end_ts": "1999-12-31T00:00:00.000",
                    "send_ts": "1999-01-16T00:00:00.000",
                    "review_ts": "2000-01-22T00:00:00.000",
                }
            ]
        });

        await expect(telosworks.contract.reviewreport({
            project_id: 1,
            milestone_id: 0,
            pay_reward: false,
            bonus: false,
        }, [
            {
                actor: user1.accountName,
                permission: "active"
            }
        ])).rejects.toThrow( "Project is not in started status, cannot review milestones");
    });

    
    it("fails if milestone id is not found", async () => { 
        await expect(telosworks.contract.reviewreport({
            project_id: 0,
            milestone_id: 24,
            pay_reward: false,
            bonus: false,
        }, [
            {
                actor: user1.accountName,
                permission: "active"
            }
        ])).rejects.toThrow("Milestone not found");
    });

      
    it("fails if milestone is not sent yet", async () => { 
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
                    "end_ts": "1999-12-31T00:00:00.000",
                    "send_ts": "1999-01-16T00:00:00.000",
                    "review_ts": "2000-01-22T00:00:00.000",
                }
            ]
        });

        await expect(telosworks.contract.reviewreport({
            project_id: 1,
            milestone_id: 0,
            pay_reward: false,
            bonus: false,
        }, [
            {
                actor: user1.accountName,
                permission: "active"
            }
        ])).rejects.toThrow("Milestone must be in sent status to review it");
    });

      
    it("fails if milestone tries to be reviewed before the end of the milestone", async () => { 
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
                    "end_ts": "2000-12-31T00:00:00.000",
                    "send_ts": "1999-01-16T00:00:00.000",
                    "review_ts": "2000-01-22T00:00:00.000",
                }
            ]
        });

        await expect(telosworks.contract.reviewreport({
            project_id: 1,
            milestone_id: 0,
            pay_reward: false,
            bonus: false,
        }, [
            {
                actor: user1.accountName,
                permission: "active"
            }
        ])).rejects.toThrow("Cannot review a milestone before it has finished its time");
    });

    it("fails if trying to pay reward for a report that was sent out of time", async () => { 
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
                    "end_ts": "1999-06-30T00:00:00.000",
                    "send_ts": "1999-08-16T00:00:00.000",
                    "review_ts": "2000-01-22T00:00:00.000",
                }
            ]
        });

        await expect(telosworks.contract.reviewreport({
            project_id: 1,
            milestone_id: 0,
            pay_reward: true,
            bonus: false,
        }, [
            {
                actor: user1.accountName,
                permission: "active"
            }
        ])).rejects.toThrow("Can only pay reward if milestone is sent on time.");
    });

    it("fails if trying to pay bonus reward for a report that was sent out of time", async () => { 
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
                    "end_ts": "1999-06-30T00:00:00.000",
                    "send_ts": "1999-08-16T00:00:00.000",
                    "review_ts": "2000-01-22T00:00:00.000",
                }
            ]
        });

        await expect(telosworks.contract.reviewreport({
            project_id: 1,
            milestone_id: 0,
            pay_reward: false,
            bonus: true,
        }, [
            {
                actor: user1.accountName,
                permission: "active"
            }
        ])).rejects.toThrow("Can only pay bonus if milestone is sent on time.");
    });

    it("fails if trying to pay bonus but not default reward", async () => {
          await expect(telosworks.contract.reviewreport({
            project_id: 0,
            milestone_id: 0,
            pay_reward: false,
            bonus: true,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Cannot pay bonus and not paying default")
    })

    it("fails if TLOS works has insuficient available funds", async () => { 
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
            "............1": [
                {
                    "proposal_id": "0",
                    "proposer": "user2",
                    "timeline": "timeline",
                    "number_milestones": 5,
                    "pdf": "pdf",
                    "usd_amount": "1000.0000 USD",
                    "locked_tlos_amount": "100000.0000 TLOS",
                    "mockups_link": "mockups_link",
                    "kanban_board_link": "kanban_board_link",
                    "update_ts": "2000-01-01T00:00:00.000"
                }
            ]
        });

        await telosworks.loadFixtures("milestones", {
            "............1": [
                {
                    "milestone_id": 0,
                    "status": 2,
                    "tlos_rewarded": "1000.0000 TLOS",
                    "title": "Title",
                    "description": "description",
                    "documents": "documents",
                    "start_ts": "1999-01-11T00:00:00.000",
                    "end_ts": "1999-12-30T00:00:00.000",
                    "send_ts": "1999-08-16T00:00:00.000",
                    "review_ts": "2000-01-22T00:00:00.000",
                }
            ]
        });

        await expect(telosworks.contract.reviewreport({
            project_id: 1,
            milestone_id: 0,
            pay_reward: true,
            bonus: true,
        }, [
            {
                actor: user1.accountName,
                permission: "active"
            }
        ])).rejects.toThrow("Telos Works has insufficient available funds");
    });

    it("fails if user other than build director tries to review report", async () => { 
        await expect(telosworks.contract.reviewreport({
            project_id: 0,
            milestone_id: 0,
            pay_reward: false,
            bonus: false,
        }, [
            {
                actor: user2.accountName,
                permission: "active"
            }
        ])).rejects.toThrow();
    });

});