void telosbuild::migrate(uint16_t counter, uint16_t max_number_rows) {

    //authenticate
    check(has_auth(get_self()), "Missing authority");
    
    migration_table migrations(get_self(), get_self().value);

    if(counter == 0) {
        //Create migration table to keep track of the process. 
        migration _migration;
        _migration.in_process = 2;
        _migration.migrating = true;
        migrations.set(_migration, get_self());
    }

    uint16_t i = 0; //Migrated rows counter


    //Open tables that you are intending to migrate 
    //and their corresponding support table HERE
    /* BEGIN MODIFY */
    projects_table projects(get_self(), get_self().value);
    support_projects_table supportprojects(get_self(), get_self().value);

    proposals_table proposals(get_self(), get_self().value);
    support_proposals_table supportprops(get_self(), get_self().value);
    /* END MODIFY */

    bool migration_ended = false;

    while(i < max_number_rows && !migration_ended) {
        /* BEGIN MODIFY */

        auto project_itr = supportprojects.begin();
        auto prop_itr = supportprops.begin();
        if(project_itr != supportprojects.end()) {

            projects.emplace(get_self(), [&](auto& col) {
                col.project_id = project_itr->project_id;
                col.title = project_itr->title;
                col.ballot_name = project_itr->ballot_name;
                col.status = project_itr->status;
                col.program_manager = project_itr->program_manager;
                col.project_manager = project_itr->project_manager;
                col.bond = project_itr->bond;
                col.description = project_itr->description;
                col.github_url = project_itr->github_url;
                col.usd_rewarded = project_itr->usd_rewarded;
                col.tlos_locked = project_itr->tlos_locked;
                col.number_proposals_rewarded = project_itr->number_proposals_rewarded;
                col.proposals_rewarded = project_itr->proposals_rewarded;
                col.proposal_selected = project_itr->proposal_selected;
                col.proposing_days = project_itr->proposing_days;
                col.voting_days = project_itr->voting_days;
                col.update_ts = project_itr->update_ts;
                col.propose_end_ts = project_itr->propose_end_ts;
                col.vote_end_ts = project_itr->vote_end_ts;
                col.start_ts = project_itr->start_ts;
                col.end_ts = project_itr->end_ts;
            });

            project_itr = supportprojects.erase(project_itr);
            
        } else if(prop_itr != supportprops.end()) {
            proposals.emplace(get_self(), [&](auto& col) {
                col.proposal_id = prop_itr->proposal_id;
                col.project_id = prop_itr->project_id;
                col.proposer = prop_itr->proposer;
                col.status = prop_itr->status;
                col.number_milestones = prop_itr->number_milestones;
                col.title = prop_itr->title;
                col.timeline = prop_itr->timeline;
                col.usd_amount = prop_itr->usd_amount;
                col.mockups_link = prop_itr->mockups_link;
                col.kanban_board_link = prop_itr->kanban_board_link;
                col.update_ts = prop_itr->update_ts;
            });

            prop_itr = supportprops.erase(prop_itr);

        }else {
            //In the final loop migrate Only singleton Tables
            /* BEGIN MODIFY */
            
            /* END MODIFY */

            //Update the migration table by setting that the migration process has ended.       
            migration _updated_migration;
            _updated_migration.in_process = 0;
            _updated_migration.migrating = false;
            migrations.set(_updated_migration, get_self());

            migration_ended = true;
        }
        
        ++i;
    }
}


