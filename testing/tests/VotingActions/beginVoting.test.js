const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("Begin Voting Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosbuild = blockchain.createAccount("telosbuild");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let decide = blockchain.createAccount("telos.decide");
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

        decide.setContract(blockchain.contractTemplates["telos.decide"]);
        eosiotoken.setContract(blockchain.contractTemplates["eosio.token"]);

        delphioracle.setContract(blockchain.contractTemplates["delphioracle"]);

        await delphioracle.loadFixtures();
    });

    beforeEach(async () => {
        telosbuild.resetTables();
        decide.resetTables();
        eosiotoken.resetTables();

        await eosiotoken.loadFixtures();

        await decide.loadFixtures();

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
                    "propose_end_ts": "1999-01-01T00:00:00.000",
                    "vote_end_ts": "1999-01-11T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                },
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "",
                    "bond": "10.0000 TLOS",
                    "status": 2,
                    "program_manager": "user1",
                    "project_manager": "",
                    "description": "description",
                    "github_url": "url",
                    "pdf": "pdf",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [],
                    "proposal_selected": [],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "1999-01-01T00:00:00.000",
                    "vote_end_ts": "1999-01-11T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                },
                {
                    "project_id": 2,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 2,
                    "program_manager": "user1",
                    "bond": "10.0000 TLOS",
                    "project_manager": "",
                    "description": "description",
                    "github_url": "url",
                    "pdf": "pdf",
                    "usd_rewarded": "10.0000 USD",
                    "tlos_locked": "0.0000 TLOS",
                    "number_proposals_rewarded": 2,
                    "proposals_rewarded": [],
                    "proposal_selected": [],
                    "proposing_days": 10,
                    "voting_days": 10,
                    "update_ts": "2000-01-01T00:00:00.000",
                    "propose_end_ts": "1999-01-01T00:00:00.000",
                    "vote_end_ts": "1999-01-11T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });

       await telosbuild.loadFixtures("proposals", {
           "telosbuild": [
               {
                "proposal_id": "0",
                "project_id": "0",
                "status": "3",
                "title": "Title",
                "proposer": "user1",
                "number_milestones": 5,
                "timeline": "timeline",
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "usd_amount": "10.0000 USD",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
               },
               {
                "proposal_id": "1",
                "project_id": "0",
                "status": "3",
                "proposer": "user1",
                "title": "Title",
                "number_milestones": 5,
                "timeline": "new timeline",
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "usd_amount": "10.0000 USD",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
               },
               {
                "proposal_id": "3",
                "project_id": "0",
                "status": "4",
                "proposer": "user1",
                "title": "Title",
                "number_milestones": 5,
                "timeline": "new timeline",
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "usd_amount": "10.0000 USD",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
               },
               {
                "proposal_id": "2",
                "project_id": "1",
                "status": "3",
                "title": "Title",
                "proposer": "user1",
                "number_milestones": 5,
                "timeline": "timeline",
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "usd_amount": "10.0000 USD",
                "mockups_link": "mockups_link",
                "kanban_board_link": "kanban_board_link",
                "update_ts": "2000-01-01T00:00:00.000"
                }
           ]
        })
    });

    it("Begin voting succeeds", async () => { 
        expect.assertions(3);

        await telosbuild.loadFixtures("config", {
            "telosbuild": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "50.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "program_managers": ["user1"],
                    "reward_percentage": 0.05,
                    "milestones_days":14
                }
            ]
        })

        await telosbuild.contract.beginvoting({
            project_id: 0,
            ballot_name: "ballotname",
            cancel: true,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }]);

        const conf = telosbuild.getTableRowsScoped("config")["telosbuild"][0];
        expect(conf.available_funds).toEqual("40.0000 TLOS");

        const project = telosbuild.getTableRowsScoped("projects")["telosbuild"];
        expect(project.find(proj => proj.project_id == "0")).toEqual({
            project_id: '0',
            title: 'Title',
            ballot_name: 'ballotname',
            status: 3,
            bond: "10.0000 TLOS",
            program_manager: 'user1',
            project_manager: "",
            description: 'description',
            github_url: 'url',
            pdf: "pdf",
            usd_rewarded: '10.0000 USD',
            tlos_locked: '0.0000 TLOS',
            number_proposals_rewarded: 2,
            proposals_rewarded: [],
            proposal_selected: [],
            proposing_days: 10,
            voting_days: 10,
            update_ts: '2000-01-01T00:00:00.000',
            propose_end_ts: '1999-01-01T00:00:00.000',
            vote_end_ts: '2000-01-11T00:00:00.000',
            start_ts: '2000-01-01T00:00:00.000',
            end_ts: '2000-01-01T00:00:00.000'
        });

        const ballot = decide.getTableRowsScoped("ballots")["telos.decide"][0];
        expect(ballot.options).toEqual([
            { key: '', value: '0.0000 VOTE' },
            { key: '............1', value: '0.0000 VOTE' }
        ]);

    });

    it("begin voting succeeds and cancels if there are no proposals", async () => {
          await telosbuild.loadFixtures("config", {
            "telosbuild": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "50.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "program_managers": ["user1"],
                    "reward_percentage": 0.05,
                    "milestones_days":14
                }
            ]
        })

        await telosbuild.contract.beginvoting({
            project_id: 2,
            ballot_name: "ballotname",
            cancel: true,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }]);

        const project = telosbuild.getTableRowsScoped("projects")["telosbuild"];
        expect(project.find(proj => proj.project_id == "2")).toEqual({
            project_id: '2',
            title: 'Title',
            ballot_name: '',
            status: 8,
            bond: "10.0000 TLOS",
            program_manager: 'user1',
            project_manager: "",
            description: 'description',
            github_url: 'url',
            pdf: "pdf",
            usd_rewarded: '10.0000 USD',
            tlos_locked: '0.0000 TLOS',
            number_proposals_rewarded: 2,
            proposals_rewarded: [],
            proposal_selected: [],
            proposing_days: 10,
            voting_days: 10,
            update_ts: '2000-01-01T00:00:00.000',
            propose_end_ts: '1999-01-01T00:00:00.000',
            vote_end_ts: '2000-01-01T00:00:00.000',
            start_ts: '2000-01-01T00:00:00.000',
            end_ts: '2000-01-01T00:00:00.000'
        });
    });

    it("begin voting succeeds and restarts proposing time if there are no proposals", async () => {
        await telosbuild.loadFixtures("config", {
            "telosbuild": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "50.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "program_managers": ["user1"],
                    "reward_percentage": 0.05,
                    "milestones_days":14
                }
            ]
        })

        await telosbuild.contract.beginvoting({
            project_id: 2,
            ballot_name: "ballotname",
            cancel: false,
        }, [{
            actor: user1.accountName,
             permission: "active"
        }]);

        const project = telosbuild.getTableRowsScoped("projects")["telosbuild"];
        expect(project.find(proj => proj.project_id == "2")).toEqual({
            project_id: '2',
            title: 'Title',
            ballot_name: '',
            status: 2,
            bond: "10.0000 TLOS",
            program_manager: 'user1',
            project_manager: "",
            description: 'description',
            github_url: 'url',
            pdf: "pdf",
            usd_rewarded: '10.0000 USD',
            tlos_locked: '0.0000 TLOS',
            number_proposals_rewarded: 2,
            proposals_rewarded: [],
            proposal_selected: [],
            proposing_days: 10,
            voting_days: 10,
            update_ts: '2000-01-01T00:00:00.000',
            propose_end_ts: '2000-01-11T00:00:00.000',
            vote_end_ts: '1999-01-11T00:00:00.000',
            start_ts: '2000-01-01T00:00:00.000',
            end_ts: '2000-01-01T00:00:00.000'
        });
    });

    it("begin voting succeeds, gives reward and cancels if there's only one proposal", async () => {
        await telosbuild.loadFixtures("config", {
            "telosbuild": [
                {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "150.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "program_managers": ["user1"],
                    "reward_percentage": 0.05,
                    "milestones_days": 14
                }
            ]
        })

        await telosbuild.contract.beginvoting({
            project_id: 1,
            ballot_name: "ballotname",
            cancel: true,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }]);


        const project = telosbuild.getTableRowsScoped("projects")["telosbuild"];
        expect(project.find(proj => proj.project_id == "1")).toEqual({
            project_id: '1',
            title: 'Title',
            ballot_name: '',
            status: 8,
            bond: "10.0000 TLOS",
            program_manager: 'user1',
            project_manager: "",
            description: 'description',
            github_url: 'url',
            pdf: "pdf",
            usd_rewarded: '10.0000 USD',
            tlos_locked: '30.7692 TLOS',
            number_proposals_rewarded: 2,
            proposals_rewarded: ["2"],
            proposal_selected: [],
            proposing_days: 10,
            voting_days: 10,
            update_ts: '2000-01-01T00:00:00.000',
            propose_end_ts: "1999-01-01T00:00:00.000",
            vote_end_ts: '2000-01-01T00:00:00.000',
            start_ts: '2000-01-01T00:00:00.000',
            end_ts: '2000-01-01T00:00:00.000'
        });

        const profiles = telosbuild.getTableRowsScoped("profiles")["telosbuild"];
        expect(profiles.find(prof => prof.account === "user1").locked_tlos_balance).toEqual("30.7692 TLOS");

        const lockedtlos = telosbuild.getTableRowsScoped("lockedtlos");
        expect(lockedtlos).toEqual({
            user1: [
            {
                locked_id: '0',
                tlos_amount: '30.7692 TLOS',
                locked_until_ts: '2000-12-31T00:00:00.000',
                memo: "TLOS rewarded for proposal 2 for project 1",
            }
            ]
        });

        const proposals = telosbuild.getTableRowsScoped("proposals")["telosbuild"];
        expect(proposals.find(prop => prop.proposal_id === "2")).toEqual(
            {
                proposal_id: '2',
                project_id: '1',
                proposer: 'user1',
                status: 5,
                title: "Title",
                number_milestones: '5',
                timeline: 'timeline',
                tech_qualifications_pdf: "tech_pdf",
                approach_pdf: "approach_pdf",
                cost_and_schedule_pdf: "cost&schedule_pdf",
                references_pdf: "references_pdf",
                usd_amount: '10.0000 USD',
                mockups_link: 'mockups_link',
                kanban_board_link: 'kanban_board_link',
                update_ts: '2000-01-01T00:00:00.000'
            }
        );

    });

    it("begin voting succeeds, gives reward but not cancel if there's only one proposal", async () => {
        await telosbuild.loadFixtures("config", {
            "telosbuild": [
                {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "150.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "program_managers": ["user1"],
                    "reward_percentage": 0.05,
                    "milestones_days": 14
                }
            ]
        })

        await telosbuild.contract.beginvoting({
            project_id: 1,
            ballot_name: "ballotname",
            cancel: false,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }]);


        const project = telosbuild.getTableRowsScoped("projects")["telosbuild"];
        expect(project.find(proj => proj.project_id == "1")).toEqual({
            project_id: '1',
            title: 'Title',
            ballot_name: '',
            status: 5,
            bond: "10.0000 TLOS",
            program_manager: 'user1',
            project_manager: "",
            description: 'description',
            github_url: 'url',
            pdf: "pdf",
            usd_rewarded: '10.0000 USD',
            tlos_locked: '0.0000 TLOS',
            number_proposals_rewarded: 2,
            proposals_rewarded: ["2"],
            proposal_selected: ["2"],
            proposing_days: 10,
            voting_days: 10,
            update_ts: '2000-01-01T00:00:00.000',
            propose_end_ts: "1999-01-01T00:00:00.000",
            vote_end_ts: '2000-01-01T00:00:00.000',
            start_ts: '2000-01-01T00:00:00.000',
            end_ts: '2000-01-01T00:00:00.000'
        });

        const proposals = telosbuild.getTableRowsScoped("proposals")["telosbuild"];
        expect(proposals.find(prop => prop.proposal_id === "2")).toEqual(
            {
                proposal_id: '2',
                project_id: '1',
                proposer: 'user1',
                status: 6,
                title: "Title",
                number_milestones: '5',
                timeline: 'timeline',
                tech_qualifications_pdf: "tech_pdf",
                approach_pdf: "approach_pdf",
                cost_and_schedule_pdf: "cost&schedule_pdf",
                references_pdf: "references_pdf",
                usd_amount: '10.0000 USD',
                mockups_link: 'mockups_link',
                kanban_board_link: 'kanban_board_link',
                update_ts: '2000-01-01T00:00:00.000'
            }
        );

    });



    it("fails if project not found", async () => { 
         await telosbuild.loadFixtures("config", {
            "telosbuild": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "50.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "program_managers": ["user1"],
                    "reward_percentage": 0.05,
                    "milestones_days":14
                }
            ]
         })
        
        await expect(telosbuild.contract.beginvoting({
            project_id: 54,
            ballot_name: "ballot",
            cancel: true,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Project not found");
    });

    it("fails if ballot name already used", async () => {
        await telosbuild.loadFixtures("config", {
            "telosbuild": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "50.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "program_managers": ["user1"],
                    "reward_percentage": 0.05,
                    "milestones_days":14
                }
            ]
        })

        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 3,
                    "title": "Title",
                    "ballot_name": "ballot",
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
                    "propose_end_ts": "1999-01-01T00:00:00.000",
                    "vote_end_ts": "1999-01-11T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });

        await expect(telosbuild.contract.beginvoting({
            project_id: 0,
            ballot_name: "ballot",
            cancel: true,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Ballot name already used");
        
         
    })

    it("fails if project is not in published state", async () => { 
         await telosbuild.loadFixtures("config", {
            "telosbuild": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "50.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "program_managers": ["user1"],
                    "reward_percentage": 0.05,
                    "milestones_days":14
                }
            ]
         })
        
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 3,
                    "title": "Title",
                    "ballot_name": "",
                    "status": 4,
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
                    "propose_end_ts": "1999-12-31T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
        
        await expect(telosbuild.contract.beginvoting({
            project_id: 3,
            ballot_name: "ballot",
            cancel: true,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Project must be in published status");
    });

    
    it("fails if propose end time hasn't been reached yet", async () => { 

         await telosbuild.loadFixtures("config", {
            "telosbuild": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "50.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "program_managers": ["user1"],
                    "reward_percentage": 0.05,
                    "milestones_days":14
                }
            ]
         })
        
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 3,
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
                    "propose_end_ts": "2001-12-31T00:00:00.000",
                    "vote_end_ts": "1970-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
        
        await expect(telosbuild.contract.beginvoting({
            project_id: 3,
            ballot_name: "ballot",
            cancel: true,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Can't start voting process until proposing time has ended.");
    }); 

    it("fails if there is a proposal that hasn't been accepted nor marked as spam", async () => {
         await telosbuild.loadFixtures("config", {
            "telosbuild": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "50.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "program_managers": ["user1"],
                    "reward_percentage": 0.05,
                    "milestones_days":14
                }
            ]
        })

        await telosbuild.loadFixtures("proposals", {
            "telosbuild": [
                {
                    "proposal_id": "5",
                    "project_id": "0",
                    "status": "1",
                    "title": "Title",
                    "proposer": "user1",
                    "number_milestones": 5,
                    "timeline": "timeline",
                    "tech_qualifications_pdf": "tech_pdf",
                    "approach_pdf": "approach_pdf",
                    "cost_and_schedule_pdf": "cost&schedule_pdf",
                    "references_pdf": "references_pdf",
                    "usd_amount": "10.0000 USD",
                    "mockups_link": "mockups_link",
                    "kanban_board_link": "kanban_board_link",
                    "update_ts": "2000-01-01T00:00:00.000"
                }
            ]
        });

        await expect(telosbuild.contract.beginvoting({
            project_id: 0,
            ballot_name: "ballotname",
            cancel: true,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("All proposals need to be set as accepted or spam before voting");
    });

    it("fails if there are not enough available funds to init voting", async () => { 
         await telosbuild.loadFixtures("config", {
            "telosbuild": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "5.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "program_managers": ["user1"],
                    "reward_percentage": 0.05,
                    "milestones_days":14
                }
            ]
        })
        await expect(telosbuild.contract.beginvoting({
            project_id: 0,
            ballot_name: "ballot",
            cancel: true,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Telos Works has insufficient available funds");
    });

    it("fails if user other than program manager tries to begin voting", async () => {
         await telosbuild.loadFixtures("config", {
            "telosbuild": [
                 {
                    "contract_version": "0.1.0",
                    "administrator": "admin",
                    "available_funds": "50.0000 TLOS",
                    "reserved_funds": "0.0000 TLOS",
                    "tlos_locked_time": 365,
                    "program_managers": ["user1"],
                    "reward_percentage": 0.05,
                    "milestones_days":14
                }
            ]
        })
        await expect(telosbuild.contract.beginvoting({
            project_id: 0,
            ballot_name: "ballot",
            cancel: true,
        }, [{
            actor: user2.accountName,
            permission: "active"
        }])).rejects.toThrow();
    });

});