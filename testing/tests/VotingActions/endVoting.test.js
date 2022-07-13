const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("End Voting Telos Works Smart Contract Tests", () => {
    let blockchain = new Blockchain(config);
    let telosbuild = blockchain.createAccount("telosbuild");
    let admin = blockchain.createAccount("admin");
    let user1 = blockchain.createAccount("user1");
    let user2 = blockchain.createAccount("user2");
    let decide = blockchain.createAccount("telos.decide");

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

        decide.updateAuth(`active`, `owner`, {
        accounts: [
            {
            permission: {
                actor: decide.accountName,
                permission: `eosio.code`
            },
            weight: 1
            }
        ]
        });
    });

    beforeEach(async () => {
        telosbuild.resetTables();
        decide.resetTables();

        await decide.loadFixtures();
        await decide.loadFixtures("ballots", {
            "telos.decide": [{
                ballot_name: 'ballot',
                category: 'leaderboard',
                publisher: 'telosbuild',
                status: 'voting',
                title: 'Title',
                description: 'Description',
                content: 'Content',
                treasury_symbol: '4,VOTE',
                voting_method: '1token1vote',
                min_options: 1,
                max_options: 1,
                options: [{key: "", value: "350.0000 VOTE"}, {key: "............1", value: "400.0000 VOTE"}, {key: "............2", value: "345.0000 VOTE"}],
                total_voters: 0,
                total_delegates: 0,
                total_raw_weight: '0.0000 VOTE',
                cleaned_count: 0,
                settings: [ { "key": "lightballot", "value": 0 }, { "key": "revotable", "value": 1 }, { "key": "voteliquid", "value": 0 }, { "key": "votestake", "value": 1 } ] ,
                begin_time: '1999-01-01T00:00:00.000',
                end_time: '1999-01-11T00:00:00.000'
            }]
        })

        await telosbuild.loadFixtures("config", require("../fixtures/telosbuild/config.json"));
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 0,
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
                    "propose_end_ts": "2001-01-01T00:00:00.000",
                    "vote_end_ts":"1999-01-11T00:00:00.000",
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
                },
                {
                    "proposal_id": "1",
                    "project_id": "0",
                    "status": "3",
                    "proposer": "user1",
                    "title": "Title",
                    "timeline": "new timeline",
                    "number_milestones": 5,
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
                    "project_id": "0",
                    "status": "4",
                    "proposer": "user1",
                    "title": "Title",
                    "timeline": "new timeline",
                    "number_milestones": 5,
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

    it("End Voting succeeds if called by program manager", async () => { 
        expect.assertions(2);

        await telosbuild.contract.endvoting({
            project_id: 0,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }]);

        const project = telosbuild.getTableRowsScoped("projects")["telosbuild"];
        expect(project.find(proj => proj.project_id === "0")).toEqual({
                project_id: '0',
                title: 'Title',
                ballot_name: "ballot",
                status: 4,
                bond: "10.0000 TLOS",
                program_manager: 'user1',
                project_manager: "",
                description: 'description',
                github_url: 'url',
                pdf: "pdf",
                usd_rewarded: '10.0000 USD',
                tlos_locked: '0.0000 TLOS',
                proposal_selected: [],
                proposals_rewarded: ["1", "0"],
                number_proposals_rewarded: 2,
                proposing_days: 10,
                voting_days: 10,
                update_ts: '2000-01-01T00:00:00.000',
                propose_end_ts: "2001-01-01T00:00:00.000",
                vote_end_ts: "1999-01-11T00:00:00.000",
                start_ts: "2000-01-01T00:00:00.000",
                end_ts: "2000-01-01T00:00:00.000",
        })

        const proposals = telosbuild.getTableRowsScoped("proposals")["telosbuild"];
        expect(proposals).toEqual([
            {
                "kanban_board_link": "kanban_board_link",
                "mockups_link": "mockups_link",
                "number_milestones": "5",
                "title": "Title",
                "project_id": "0",
                "proposal_id": "0",
                "proposer": "user1",
                "status": 5,
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "timeline": "timeline",
                "update_ts": "2000-01-01T00:00:00.000",
                "usd_amount": "10.0000 USD"
            }, {
                "kanban_board_link": "kanban_board_link",
                "mockups_link": "mockups_link",
                "number_milestones": "5",
                "title": "Title",
                "project_id": "0",
                "proposal_id": "1",
                "proposer": "user1",
                "status": 5,
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "timeline": "new timeline",
                "update_ts": "2000-01-01T00:00:00.000",
                "usd_amount": "10.0000 USD"
            }, {
                "kanban_board_link": "kanban_board_link",
                "mockups_link": "mockups_link",
                "number_milestones": "5",
                "title": "Title",
                "project_id": "0",
                "proposal_id": "2",
                "proposer": "user1",
                "status": 4,
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "timeline": "new timeline",
                "update_ts": "2000-01-01T00:00:00.000",
                "usd_amount": "10.0000 USD"
            }]
        );
    });

    it("End Voting succeeds if called by administrator", async () => { 
        expect.assertions(2);

        await telosbuild.contract.endvoting({
            project_id: 0,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }]);

        const project = telosbuild.getTableRowsScoped("projects")["telosbuild"];
        expect(project.find(proj => proj.project_id === "0")).toEqual({
                project_id: '0',
                title: 'Title',
                ballot_name: "ballot",
                status: 4,
                program_manager: 'user1',
                bond: "10.0000 TLOS",
                project_manager: "",
                description: 'description',
                github_url: 'url',
                pdf: "pdf",
                usd_rewarded: '10.0000 USD',
                tlos_locked: '0.0000 TLOS',
                proposal_selected: [],
                proposals_rewarded: ["1", "0"],
                number_proposals_rewarded: 2,
                proposing_days: 10,
                voting_days: 10,
                update_ts: '2000-01-01T00:00:00.000',
                propose_end_ts: "2001-01-01T00:00:00.000",
                vote_end_ts: "1999-01-11T00:00:00.000",
                start_ts: "2000-01-01T00:00:00.000",
                end_ts: "2000-01-01T00:00:00.000",
        })

        const proposals = telosbuild.getTableRowsScoped("proposals")["telosbuild"];
        expect(proposals).toEqual([
            {
                "kanban_board_link": "kanban_board_link",
                "mockups_link": "mockups_link",
                "number_milestones": "5",
                "title": "Title",
                "project_id": "0",
                "proposal_id": "0",
                "proposer": "user1",
                "status": 5,
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "timeline": "timeline",
                "update_ts": "2000-01-01T00:00:00.000",
                "usd_amount": "10.0000 USD"
            }, {
                "kanban_board_link": "kanban_board_link",
                "mockups_link": "mockups_link",
                "number_milestones": "5",
                "title": "Title",
                "project_id": "0",
                "proposal_id": "1",
                "proposer": "user1",
                "status": 5,
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "timeline": "new timeline",
                "update_ts": "2000-01-01T00:00:00.000",
                "usd_amount": "10.0000 USD"
            }, {
                "kanban_board_link": "kanban_board_link",
                "mockups_link": "mockups_link",
                "number_milestones": "5",
                "title": "Title",
                "project_id": "0",
                "proposal_id": "2",
                "proposer": "user1",
                "status": 4,
                "tech_qualifications_pdf": "tech_pdf",
                "approach_pdf": "approach_pdf",
                "cost_and_schedule_pdf": "cost&schedule_pdf",
                "references_pdf": "references_pdf",
                "timeline": "new timeline",
                "update_ts": "2000-01-01T00:00:00.000",
                "usd_amount": "10.0000 USD"
            }]
        );

    });

    it("fails if project not found", async () => { 
        await expect(telosbuild.contract.endvoting({
            project_id: 54,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Project not found");
    });

    it("fails if project is not in voting state", async () => { 
        await telosbuild.loadFixtures("projects", {
            "telosbuild": [
                {
                    "project_id": 1,
                    "title": "Title",
                    "ballot_name": "ballot",
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
                }
            ]
        });
        
        await expect(telosbuild.contract.endvoting({
            project_id: 1,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Project status must be in voting state");
    });

    it("fails if trying to end voting before proposing time ended", async () => { 
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
                    "propose_end_ts": "1999-12-31T00:00:00.000",
                    "vote_end_ts": "2001-01-01T00:00:00.000",
                    "start_ts": "2000-01-01T00:00:00.000",
                    "end_ts": "2000-01-01T00:00:00.000",
                }
            ]
        });
        
        await expect(telosbuild.contract.endvoting({
            project_id: 1,
        }, [{
            actor: user1.accountName,
            permission: "active"
        }])).rejects.toThrow("Vote time has not ended");
    });

    it("fails if user other than program manager or admin tries to end voting", async () => { 
         await expect(telosbuild.contract.endvoting({
            project_id: 54,
        }, [{
            actor: user2.accountName,
            permission: "active"
        }])).rejects.toThrow();
    });

});