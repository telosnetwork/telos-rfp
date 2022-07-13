const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Start project Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosbuild = blockchain.createAccount("telosbuild");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let user3 = blockchain.createAccount("user3");
    let eosiotoken = blockchain.createAccount("eosio.token");
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

        eosiotoken.setContract(blockchain.contractTemplates["eosio.token"]);
        delphioracle.setContract(blockchain.contractTemplates["delphioracle"]);

        await delphioracle.loadFixtures();

    });

    beforeEach(async () => {
        telosbuild.resetTables();

        await telosbuild.loadFixtures("config", require("../fixtures/telosbuild/config.json"));
        await telosbuild.loadFixtures("profiles", {
            "telosbuild": [
                {
                    "account": "user2",
                    "locked_tlos_balance": "100.0000 TLOS",
                    "tlos_balance": "0.0000 TLOS",
                    "locked_tlos_bonds": "0.0000 TLOS"
                }
            ]
        });
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 0,
                    "title": "Title",
                    "ballot_name": "ballot",
                    "status": 5,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "user2",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
                    "usd_rewarded": "5.0000 USD",
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

        await telosbuild.loadFixtures("proposals", {
           "telosbuild": [{
                "proposal_id": "0",
                "project_id": "0",
                "status": "6",
                "title": "Title",
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
            },{
                "proposal_id": "1",
                "project_id": "0",
                "status": "5",
                "proposer": "user3",
                "title": "Title",
                "timeline": "timeline",
                "number_milestones": 5,
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "usd_amount": "15.0000 USD",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
            }]
        })
    });

    it("Start Project succeeds", async () => { 
        expect.assertions(6);

        await telosbuild.contract.startproject({
            project_id: 0,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }]);


        const config = telosbuild.getTableRowsScoped("config")["telosbuild"][0];
        expect(config).toEqual({
            contract_version: '0.1.0',
            administrator: 'admin',
            available_funds: '19.2308 TLOS',
            reserved_funds: '30.7692 TLOS',
            program_managers: [ 'user1' ],
            reward_percentage: 0.05,
            milestones_days: 14,
            tlos_locked_time: 365
        })

        const projects = telosbuild.getTableRowsScoped("projects")["telosbuild"];
        expect(projects.find(proj => proj.project_id === "0")).toEqual({
            project_id: '0',
            title: 'Title',
            ballot_name: 'ballot',
            status: 6,
            bond: "10.0000 TLOS",
            program_manager: 'user1',
            project_manager: "user2",
            description: 'description',
            github_url: 'url',
            pdf: "pdf",
            usd_rewarded: '5.0000 USD',
            tlos_locked: '15.3846 TLOS',
            number_proposals_rewarded: 2,
            proposals_rewarded: [ '0', '1' ],
            proposal_selected: [ '0' ],
            proposing_days: 10,
            voting_days: 10,
            update_ts: '2000-01-01T00:00:00.000',
            propose_end_ts: '2001-01-01T00:00:00.000',
            vote_end_ts: '1970-01-01T00:00:00.000',
            start_ts: '2000-01-01T00:00:00.000',
            end_ts: '2000-01-01T00:00:00.000'
        });

        const profiles = telosbuild.getTableRowsScoped("profiles")["telosbuild"];
        expect(profiles.find(prof => prof.account === "user2").locked_tlos_balance).toEqual("115.3846 TLOS");
        expect(profiles.find(prof => prof.account === "user3").locked_tlos_balance).toEqual("15.3846 TLOS");

        const lockedtlos = telosbuild.getTableRowsScoped("lockedtlos");
        expect(lockedtlos).toEqual({
            user2: [
            {
                locked_id: '0',
                tlos_amount: '15.3846 TLOS',
                locked_until_ts: '2000-12-31T00:00:00.000',
                memo: "TLOS rewarded for being one of the most voted proposal for project 0",
            }
            ],
            user3: [
            {
                locked_id: '0',
                tlos_amount: '15.3846 TLOS',
                locked_until_ts: '2000-12-31T00:00:00.000',
                memo: "TLOS rewarded for being one of the most voted proposal for project 0",
            }
            ]
        });

        const proposals = telosbuild.getTableRowsScoped("proposals")["telosbuild"];
        expect(proposals).toEqual([
                {
                proposal_id: '0',
                project_id: "0",
                proposer: 'user2',
                status: 6,
                title: "Title",
                number_milestones: '5',
                timeline: 'timeline',
                usd_amount: '10.0000 USD',
                mockups_link: 'mockups_link',
                kanban_board_link: 'kanban_board_link',
                update_ts: '2000-01-01T00:00:00.000',
                tech_qualifications_pdf: "tech_pdf",
                approach_pdf: "approach_pdf",
                cost_and_schedule_pdf: "cost&schedule_pdf",
                references_pdf: "references_pdf",
                },
                {
                proposal_id: '1',
                project_id: "0",
                status: 5,
                title: "Title",
                proposer: 'user3',
                number_milestones: '5',
                timeline: 'timeline',
                usd_amount: '15.0000 USD',
                mockups_link: 'mockups_link',
                kanban_board_link: 'kanban_board_link',
                update_ts: '2000-01-01T00:00:00.000',
                tech_qualifications_pdf: "tech_pdf",
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",approach_pdf: "approach_pdf",
                cost_and_schedule_pdf: "cost&schedule_pdf",
                references_pdf: "references_pdf",
                }
            ]
        );
    });

    it("fails if project not found", async () => { 
        await expect(telosbuild.contract.startproject({
            project_id: 54,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Project not found");
    });

    it("fails if project is not in selected state", async () => { 
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 2,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "user2",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
                    "usd_rewarded": "5.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [],
                    "proposal_selected": [],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "1999-12-31T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
        
        await expect(telosbuild.contract.startproject({
            project_id: 1,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Project status must be in selected status");
    });

    
    it("fails if telos Works has insufficient available funds", async () => { 
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 5,
                    "bond": "10.0000 TLOS",
                    "program_manager": "user1",
                    "project_manager": "user2",
                    "description": "description",
                    "github_url": "url",
                    "pdf":"pdf",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "500.0000 TLOS",
                    "number_proposals_rewarded": 5,
                    "proposals_rewarded": ["0", "1", "2"],
                    "proposal_selected": ["0"],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "1999-12-31T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
        
        await expect(telosbuild.contract.startproject({
            project_id: 1,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Telos Works has insufficient available funds");
    });

    it("fails if user other than program manager tries to start project", async () => { 
        await expect(telosbuild.contract.startproject({
            project_id: 0,
        }, [{
            actor: user2.accountName,
            permission: "active"
        }])).rejects.toThrow();
    });

});
