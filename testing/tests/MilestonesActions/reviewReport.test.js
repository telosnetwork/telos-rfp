const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Review Report Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosbuild = blockchain.createAccount("telosbuild");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let delphioracle = blockchain.createAccount("delphioracle");

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

        delphioracle.setContract(blockchain.contractTemplates["delphioracle"]);

        await delphioracle.loadFixtures();
    });

    beforeEach(async () => {
        telosbuild.resetTables();

        await telosbuild.loadFixtures("config", require("../fixtures/telosbuild/config.json"));
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 0,
                    "title": "Title",
                    "ballot_name": "ballot",
                    "status": 6,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "user2",
                    "description": "description",
                    "github_url": "url",
                    "pdf": "pdf",
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

        await telosbuild.loadFixtures("milestones", {
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

        await telosbuild.loadFixtures("proposals", {
           "telosbuild": [{
                "proposal_id": "0",
                "project_id": "0",
                "title": "Title",
                "status": "6",
                "proposer": "user2",
                "timeline": "timeline",
                "number_milestones": 5,
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "usd_amount": "10.0000 USD",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })
    });

    it("Review report succeeds and pays the reward", async () => { 
        expect.assertions(4);

        await telosbuild.contract.reviewreport({
            project_id: 0,
            milestone_id: 0,
            pay_reward: true,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }]);


        const conf = telosbuild.getTableRowsScoped("config")["telosbuild"][0];
        expect(conf.reserved_funds).toEqual("3.0000 TLOS");
        expect(conf.available_funds).toEqual("47.0000 TLOS");

        const milestones = telosbuild.getTableRowsScoped("milestones")[""];
        expect(milestones.find(mls => mls.milestone_id == 0)).toEqual({
            "milestone_id": "0",
            "status": 3,
            "tlos_rewarded": "3.0000 TLOS",
            "title": "Title",
            "description": "description",
            "documents": "documents",
            "start_ts": "1999-01-11T00:00:00.000",
            "end_ts": "1999-12-31T00:00:00.000",
            "send_ts": "1999-01-16T00:00:00.000",
            "review_ts": "2000-01-01T00:00:00.000",
        });

        const lockedtlos = telosbuild.getTableRowsScoped("lockedtlos")["user2"];
        expect(lockedtlos).toBeUndefined();
    });

    it("Review report succeeds and do not pay the reward", async () => { 
        expect.assertions(3);

        await telosbuild.contract.reviewreport({
            project_id: 0,
            milestone_id: 0,
            pay_reward: false,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }]);


        const conf = telosbuild.getTableRowsScoped("config")["telosbuild"][0];
        expect(conf.reserved_funds).toEqual("0.0000 TLOS");
        expect(conf.available_funds).toEqual("50.0000 TLOS");

        const milestones = telosbuild.getTableRowsScoped("milestones")[""];
        expect(milestones.find(mls => mls.milestone_id == 0)).toEqual({
            "milestone_id": "0",
            "status": 3,
            "tlos_rewarded": "0.0000 TLOS",
            "title": "Title",
            "description": "description",
            "documents": "documents",
            "start_ts": "1999-01-11T00:00:00.000",
            "end_ts": "1999-12-31T00:00:00.000",
            "send_ts": "1999-01-16T00:00:00.000",
            "review_ts": "2000-01-01T00:00:00.000",
        });
    });

    it("fails if project not found", async () => { 
        await expect(telosbuild.contract.reviewreport({
            project_id: 24,
            milestone_id: 0,
            pay_reward: false
        }, [
            {
                actor: user1.accountName,
                permission: "active"
            }
        ])).rejects.toThrow("Project not found");
    });

    it("fails if project is not in started state", async () => { 
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "ballot",
                    "status": 3,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "user2",
                    "description": "description",
                    "github_url": "url",
                    "pdf": "pdf",
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

        await telosbuild.loadFixtures("milestones", {
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

        await expect(telosbuild.contract.reviewreport({
            project_id: 1,
            milestone_id: 0,
            pay_reward: false,
        }, [
            {
                actor: user1.accountName,
                permission: "active"
            }
        ])).rejects.toThrow( "Project is not in started status, cannot review milestones");
    });

    
    it("fails if milestone id is not found", async () => { 
        await expect(telosbuild.contract.reviewreport({
            project_id: 0,
            milestone_id: 24,
            pay_reward: false,
        }, [
            {
                actor: user1.accountName,
                permission: "active"
            }
        ])).rejects.toThrow("Milestone not found");
    });

      
    it("fails if milestone is not sent yet", async () => { 
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "ballot",
                    "status": 6,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "user2",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
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

        await telosbuild.loadFixtures("milestones", {
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

        await expect(telosbuild.contract.reviewreport({
            project_id: 1,
            milestone_id: 0,
            pay_reward: false,
        }, [
            {
                actor: user1.accountName,
                permission: "active"
            }
        ])).rejects.toThrow("Milestone must be in sent status to review it");
    });

      
    it("fails if milestone tries to be reviewed before the end of the milestone", async () => { 
         await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "ballot",
                    "status": 6,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "user2",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
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

        await telosbuild.loadFixtures("milestones", {
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

        await expect(telosbuild.contract.reviewreport({
            project_id: 1,
            milestone_id: 0,
            pay_reward: false,
        }, [
            {
                actor: user1.accountName,
                permission: "active"
            }
        ])).rejects.toThrow("Cannot review a milestone before it has finished its time");
    });

    it("fails if trying to pay reward for a report that was sent out of time", async () => { 
         await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "ballot",
                    "status": 6,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "user2",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
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

        await telosbuild.loadFixtures("milestones", {
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

        await expect(telosbuild.contract.reviewreport({
            project_id: 1,
            milestone_id: 0,
            pay_reward: true,
        }, [
            {
                actor: user1.accountName,
                permission: "active"
            }
        ])).rejects.toThrow("Can only pay reward if milestone is sent on time.");
    });

    it("fails if TLOS works has insuficient available funds", async () => { 
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "ballot",
                    "status": 6,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "user2",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": ["0","1"],
                    "proposal_selected": ["1"],
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
            "telosbuild": [
                {
                    "proposal_id": "1",
                    "project_id": "1",
                    "title": "Title",
                    "status": "6",
                    "proposer": "user2",
                    "timeline": "timeline",
                    "number_milestones": 5,
                    "tech_qualifications_pdf": "tech_pdf",
                    "approach_pdf": "approach_pdf",
                    "cost_and_schedule_pdf": "cost&schedule_pdf",
                    "references_pdf": "references_pdf",
                    "usd_amount": "100000.0000 USD",
                    "mockups_link": "mockups_link",
                    "kanban_board_link": "kanban_board_link",
                    "update_ts": "2000-01-01T00:00:00.000"
                }
            ]
        });

        await telosbuild.loadFixtures("milestones", {
            "............1": [
                {
                    "milestone_id": 0,
                    "status": 2,
                    "tlos_rewarded": "500.0000 TLOS",
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

        await expect(telosbuild.contract.reviewreport({
            project_id: 1,
            milestone_id: 0,
            pay_reward: true,
        }, [
            {
                actor: user1.accountName,
                permission: "active"
            }
        ])).rejects.toThrow("Telos Works has insufficient available funds");
    });

    it("fails if user other than program manager tries to review report", async () => { 
        await expect(telosbuild.contract.reviewreport({
            project_id: 0,
            milestone_id: 0,
            pay_reward: false,
        }, [
            {
                actor: user2.accountName,
                permission: "active"
            }
        ])).rejects.toThrow();
    });

});
