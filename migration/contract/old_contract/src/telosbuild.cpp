#include "../include/telosbuild.hpp"

//======================== config actions ========================

void telosbuild::init(name initial_admin)
{
    //authenticate
    require_auth(get_self());

    //open config singleton
    config_singleton configs(get_self(), get_self().value);

    //validate
    check(!configs.exists(), "contract already initialized");
    check(is_account(initial_admin), "initial admin account doesn't exist");

    //initialize
    config initial_conf;
    initial_conf.contract_version = "0.1.0";
    initial_conf.administrator = initial_admin;

    //set initial config
    configs.set(initial_conf, get_self());
}

void telosbuild::setversion(string new_version)
{
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //authenticate
    require_auth(conf.administrator);

    //change contract version
    conf.contract_version = new_version;

    //set new config
    configs.set(conf, get_self());
}

void telosbuild::setadmin(name new_admin)
{
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //authenticate
    require_auth(conf.administrator);

    //validate
    check(is_account(new_admin), "new admin account doesn't exist");

    //change admin
    conf.administrator = new_admin;

    //set new config
    configs.set(conf, get_self());
}

void telosbuild::setlckdtime(uint32_t days)
{
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //authenticate
    require_auth(conf.administrator);

    //validate 
    check(days > 0, "Minimum Locked days must be greater than 0");

    //change locked days
    conf.tlos_locked_time = days;

    //set new config
    configs.set(conf, get_self());
}

void telosbuild::setmilestone(uint32_t days)
{
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //authenticate
    require_auth(conf.administrator);

    //validate 
    check(days > 0, "Milestones must last at least 1 day");

    //change locked days
    conf.milestones_days = days;

    //set new config
    configs.set(conf, get_self());
}

void telosbuild::addmanager(name manager) {
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //authenticate
    require_auth(conf.administrator);

    check(is_account(manager), "The user " + manager.to_string() + " is not a TLOS account");

    auto program_manager_itr = std::find(conf.program_managers.begin(), conf.program_managers.end(), manager);

    check(program_manager_itr == conf.program_managers.end(), "The user " + manager.to_string() + " is already set as program manager");

    conf.program_managers.push_back(manager);
    configs.set(conf,get_self());

};

void telosbuild::rmvmanager(name manager) {
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //authenticate
    require_auth(conf.administrator);

    auto program_manager_itr = std::find(conf.program_managers.begin(), conf.program_managers.end(), manager);
    check(program_manager_itr != conf.program_managers.end(), "The user " + manager.to_string() + " is not set as program manager");

    //open tables, get project 
    projects_table projects(get_self(), get_self().value);
    
    auto manager_idx = projects.get_index<name("byprogrammgr")>();
    auto itr_start = manager_idx.lower_bound(manager.value);
    auto itr_end = manager_idx.upper_bound(manager.value);

    while( itr_start != itr_end ) {
        check(itr_start->status ==  project_status::drafting, "Can not remove a program manager that has active projects");
        itr_start = manager_idx.erase(itr_start);
    }

    conf.program_managers.erase(program_manager_itr);
    configs.set(conf,get_self());
};


//======================== profile actions ========================

// void telosbuild::addprofile(name account, string full_name, string country, string email, string company)
// {
//     //authenticate
//     require_auth(account);

//     //open profiles table, find profile
//     profiles_table profiles(get_self(), get_self().value);
//     auto prof_itr = profiles.find(account.value);

//     //validate
//     if(prof_itr == profiles.end()) {
//         //create new profile
//         //ram payer: profile owner
//         profiles.emplace(account, [&](auto& col) {
//             col.account = account;
//             col.full_name = full_name;
//             col.country = country;
//             col.email = email;
//             col.company = company;
//         });
//     } else {
//         profiles.modify(prof_itr, same_payer, [&](auto& col) {
//             col.full_name = full_name;
//             col.country = country;
//             col.email = email;
//             col.company = company;
//         });
//     }
// }


// void telosbuild::rmvprofile(name account)
// {
//     //open config singleton, get config
//     config_singleton configs(get_self(), get_self().value);
//     auto conf = configs.get();

//     //open profiles table, find profile
//     profiles_table profiles(get_self(), get_self().value);
//     auto& prof = profiles.get(account.value, "profile not found");

//     //authenticate
//     check(has_auth(prof.account) || has_auth(conf.administrator), "requires authentication from profile account or admin account");

//     auto program_manager_itr = std::find(conf.program_managers.begin(), conf.program_managers.end(), account);
//     check(program_manager_itr == conf.program_managers.end(), "Can't delete a program manager account, need to be removed from program manager list first");

//     //erase profile
//     profiles.erase(prof);
// }



void telosbuild::claimreward(name account, uint64_t locked_id) {

    //authenticate
    require_auth(account);

    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open profiles table 
    profiles_table profiles(get_self(), get_self().value);
    auto& prof = profiles.get(account.value, "Profile not found");

    locked_tlos_table lockedtlos(get_self(), account.value);
    auto& locked_itr = lockedtlos.get(locked_id, "Locked tlos id not found");

    check(time_point_sec(current_time_point()) >= locked_itr.locked_until_ts, "TLOS is still locked");
    
    //update and set conf
    conf.reserved_funds -= locked_itr.tlos_amount;
    configs.set(conf, get_self());

    //update profiles balance
    profiles.modify(prof, same_payer, [&](auto& col) {
        col.locked_tlos_balance -= locked_itr.tlos_amount;
    });

    //inline transfer
    action(permission_level{get_self(), name("active")}, name("eosio.token"), name("transfer"), make_tuple(
        get_self(), //from
        account, //to
        locked_itr.tlos_amount, //quantity
        std::string("Telos Works Withdrawal") //memo
    )).send();

    lockedtlos.erase(locked_itr);
}


void telosbuild::withdraw(name account, asset quantity)
{
    //authenticate
    require_auth(account);

    //validate
    check(quantity.symbol == TLOS_SYM, "must withdraw TLOS");
    check(quantity.amount > 0, "must withdraw positive amount");

    //open profiles table 
    profiles_table profiles(get_self(), get_self().value);
    auto& prof = profiles.get(account.value, "Profile not found");

    check(prof.tlos_balance.amount >= quantity.amount, "Quantity cannot be higher than tlos balance");

    //update profiles balance
    profiles.modify(prof, same_payer, [&](auto& col) {
        col.tlos_balance -= quantity;
    });

    //inline transfer
    action(permission_level{get_self(), name("active")}, name("eosio.token"), name("transfer"), make_tuple(
        get_self(), //from
        account, //to
        quantity, //quantity
        std::string("Telos Works Withdrawal") //memo
    )).send();
}



//======================= Blacklist users =========================

void telosbuild::adduserbl(name account) {
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //authenticate
    require_auth(conf.administrator);

    // profiles_table users(get_self(), get_self().value);
    // check(users.find(account.value) != users.end(), "account doesn't exist in the system");
    check(is_account(account), "account doesn't exist in the system");

    blacklist_users usersbl(get_self(), get_self().value);
    check(usersbl.find(account.value) == usersbl.end(), "This account is already in users blacklist");

    usersbl.emplace(get_self(), [&](auto& row) {
        row.account = account;
    });
};


void telosbuild::rmvuserbl(name account) {
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //authenticate
    require_auth(conf.administrator);

    blacklist_users usersbl(get_self(), get_self().value);
    auto user = usersbl.find(account.value);
    check(user != usersbl.end(), "This account is not in users blacklist");

    usersbl.erase(user);
};

//======================= project actions =========================

void telosbuild::draftproject(string title, name program_manager, asset bond, string description, string github_url, asset usd_rewarded, 
    uint8_t number_proposals_rewarded, uint32_t proposing_days, uint32_t voting_days) {
    
    //open config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();
    
    //Authenticate
    require_auth(program_manager);
    auto program_manager_itr = std::find(conf.program_managers.begin(), conf.program_managers.end(), program_manager);
    check(program_manager_itr != conf.program_managers.end(), "Only program managers can create projects");

    //validate
    check(bond.symbol == TLOS_SYM, "Bond must be set in TLOS");
    check(bond.amount > 0, "Bond amount must be greater than zero");
    check(title.length() <= MAX_TITLE_LEN, "title string is too long");
    check(description.length() <= MAX_DESCR_LEN, "description string is too long");
    check(usd_rewarded.symbol == USD_SYM && usd_rewarded.amount > 0, "asset has to be USD and greater than zero");
    check(number_proposals_rewarded > 0, "number_proposals_rewarded must be greater than zero");
    check(proposing_days > 0, "proposing days must be greater than zero");
    check(voting_days > 0, "voting days must be greater than zero");

    //open tables
    projects_table projects(get_self(), get_self().value);

    //initialize
    uint64_t new_project_id = projects.available_primary_key();


    //create new project
    projects.emplace(program_manager, [&](auto& col) {
        col.project_id = new_project_id;
        col.title = title;
        col.program_manager = program_manager;
        col.bond = bond;
        col.description = description;
        col.github_url = github_url;
        col.usd_rewarded = usd_rewarded;
        col.number_proposals_rewarded = number_proposals_rewarded;
        col.proposing_days = proposing_days;
        col.voting_days = voting_days;
        col.update_ts = time_point_sec(current_time_point());
    });
};

void telosbuild::editproject(uint64_t project_id, optional<asset> bond, optional<string> title, optional<string> description, 
    optional<string> github_url, optional<asset> usd_rewarded, optional<uint8_t> number_proposals_rewarded,
    optional<uint32_t> proposing_days, optional<uint32_t> voting_days){

    //open config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open tables, get project 
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "project not found");

    //validate
    check(project.status == project_status::drafting,"project must be drafting to edit");


    //Authenticate
    require_auth(project.program_manager);   
    
    asset new_bond = project.bond;
    if(bond) {
        new_bond = *bond;
        check(new_bond.symbol == TLOS_SYM, "Bond must be set in TLOS");
        check(new_bond.amount > 0, "Bond has to be greater than zero");
    }
    string new_title = project.title;
    if (title) {
        new_title = *title;
        check(new_title.length() <= MAX_TITLE_LEN, "title string is too long");
    }

    string new_desc = project.description;
    if (description) {
        new_desc = *description;
        check(new_desc.length() <= MAX_DESCR_LEN, "description string is too long");
    }

    string new_github_url = project.github_url;
    if (github_url) {
        new_github_url = *github_url;
    }

    asset new_usd_rewarded = project.usd_rewarded;
    if (usd_rewarded) {
        new_usd_rewarded = *usd_rewarded;
        check(usd_rewarded->symbol == USD_SYM && usd_rewarded->amount > 0, "asset has to be USD and greater than zero");
    }

    uint32_t new_number_proposals_rewarded = project.number_proposals_rewarded;
    if (number_proposals_rewarded) {
        new_number_proposals_rewarded = *number_proposals_rewarded;
        check(number_proposals_rewarded > 0, "number_proposals_rewarded must be greater than zero");
    }


    uint32_t new_proposing_days = project.proposing_days;
    if(proposing_days) {
        check(proposing_days > 0, "proposing days must be greater than zero");
        new_proposing_days = *proposing_days;
    }

    uint32_t new_voting_days = project.voting_days;
    if(voting_days) {
        check(voting_days > 0, "voting days must be greater than zero");
        new_voting_days = *voting_days;
    }

    //modify existant project
    projects.modify(project, same_payer, [&](auto& col) {
        col.bond = new_bond;
        col.title = new_title;
        col.description = new_desc;
        col.github_url = new_github_url;
        col.usd_rewarded = new_usd_rewarded;
        col.number_proposals_rewarded = new_number_proposals_rewarded;
        col.proposing_days = new_proposing_days;
        col.voting_days = new_voting_days;
        col.update_ts = time_point_sec(current_time_point());
    });

};

void telosbuild::rmvproject(uint64_t project_id) {
      
    //open tables, get project 
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "project not found");

    //Authenticate
    require_auth(project.program_manager);   

    //validate
    check(project.status == project_status::drafting,"project must be drafting to delete");

    projects.erase(project);
}

void telosbuild::publishprjct(uint64_t project_id) {

    //open tables, get project 
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "project not found");

    //Authenticate
    require_auth(project.program_manager);   

    check(project.status == project_status::drafting,"project must be drafting to publish it");
        
    //update project
    projects.modify(project, same_payer, [&](auto& col) {
        col.status = static_cast<uint8_t>(project_status::published);
        col.propose_end_ts =  time_point_sec(current_time_point()) + project.proposing_days*86400;
        col.update_ts = time_point_sec(current_time_point());
    });
}

void telosbuild::startproject(uint64_t project_id)
{
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    //authenticate
    require_auth(project.program_manager);

    //validate
    check(project.status == project_status::selected, "Project status must be in selected status");
    
    auto tlosusd = tlosusdprice();
    float tlos_amount = float(project.usd_rewarded.amount*10000 / tlosusd);
    auto tlos_locked = asset(2*tlos_amount, TLOS_SYM);

    auto num_proposals_rewarded = project.proposals_rewarded.size();
    auto total_telos_rewarded = num_proposals_rewarded*tlos_locked;
    check(conf.available_funds.amount >= total_telos_rewarded.amount, "Telos Works has insufficient available funds");

    //update config funds
    conf.available_funds -= total_telos_rewarded;
    conf.reserved_funds += total_telos_rewarded;
    configs.set(conf, get_self());

    //update project; rampayer=self because of inserting the string
    projects.modify(project, same_payer, [&](auto& col) {
        col.status = static_cast<uint8_t>(project_status::started);
        col.update_ts = time_point_sec(current_time_point());
        col.start_ts = time_point_sec(current_time_point());
        col.tlos_locked = tlos_locked;
    });

    //open proposals table
    proposals_table proposals(get_self(), get_self().value);

    //open profiles table 
    profiles_table profiles(get_self(), get_self().value);

    for(auto i = 0; i < project.proposals_rewarded.size(); ++i) {
        auto proposal_rw = proposals.find(project.proposals_rewarded[i]);
        auto user_rewarded = proposal_rw->proposer;

        auto prof = profiles.find(user_rewarded.value);
        if(prof != profiles.end()) {
            profiles.modify(prof, get_self(), [&](auto& col) {
                col.locked_tlos_balance += tlos_locked;
            });
        } else {
            profiles.emplace(get_self(), [&](auto& col) {
                col.account = user_rewarded;
                col.locked_tlos_balance = tlos_locked;
            });
        }
      
        locked_tlos_table lockedtlos(get_self(), user_rewarded.value);

        uint64_t new_locked_id = lockedtlos.available_primary_key();

        string memo = string("TLOS rewarded for being one of the most voted proposal for project " + to_string(project_id));

        lockedtlos.emplace(get_self(), [&](auto& col) {
            col.locked_id = new_locked_id;
            col.tlos_amount = tlos_locked;
            col.locked_until_ts =  time_point_sec(current_time_point()) + conf.tlos_locked_time*86400;
            col.memo = memo;
        });
    }

    auto start_time = time_point_sec(current_time_point());
    milestones_table milestones(get_self(), project_id);

    auto proposal = proposals.find(project.proposal_selected[0]);

    for(auto i = 0; i < proposal->number_milestones; ++i) {
        milestones.emplace(get_self(), [&](auto& col){
            col.milestone_id = i;
            col.tlos_rewarded = asset(0, TLOS_SYM);
            col.title = "";
            col.description = "";
            col.documents = "";
            col.start_ts = start_time;
            col.end_ts = start_time + conf.milestones_days*86400 - 1;
        });

        start_time += conf.milestones_days*86400;
    }

}

void telosbuild::endproject(uint64_t project_id) {
    
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    //open proposals table
    proposals_table proposals(get_self(), get_self().value);
    auto& proposal = proposals.get(project.proposal_selected[0]);

    //authenticate
    require_auth(project.program_manager);

    //validate
    check(project.status == project_status::started, "Project must be in started status to be able to close it.");

    asset tlos_rewarded_milestones = asset(0, TLOS_SYM);

    milestones_table milestones(get_self(), project_id);
    for( auto& milestone : milestones ) {
        tlos_rewarded_milestones += milestone.tlos_rewarded;
        check(milestone.status == milestone_status::reviewed, "All milestones needs to be reviewed to end the project");
    }

    check(conf.available_funds.amount >= tlos_rewarded_milestones.amount, "Telos Works has insufficient available funds");

    //update config funds
    conf.available_funds -= tlos_rewarded_milestones;
    conf.reserved_funds += tlos_rewarded_milestones;
    configs.set(conf, get_self());

    //open profiles table 
    profiles_table profiles(get_self(), get_self().value);
    auto prof = profiles.find(proposal.proposer.value);

    if(prof != profiles.end()) {
        profiles.modify(prof, get_self(), [&](auto& col) {
            col.locked_tlos_balance += tlos_rewarded_milestones;
        });
    } else {
        profiles.emplace(get_self(), [&](auto& col) {
            col.account = proposal.proposer;
            col.locked_tlos_balance = tlos_rewarded_milestones;
        });
    }
    
    locked_tlos_table lockedtlos(get_self(), proposal.proposer.value);

    uint64_t new_locked_id = lockedtlos.available_primary_key();

    string memo = string("TLOS rewards for the milestones of the proposal " + to_string(proposal.proposal_id) 
        + " of the project " + to_string(project.project_id));

    lockedtlos.emplace(get_self(), [&](auto& col) {
        col.locked_id = new_locked_id;
        col.tlos_amount = tlos_rewarded_milestones;
        col.locked_until_ts =  time_point_sec(current_time_point()) + conf.tlos_locked_time*86400;
        col.memo = memo;
    });

    projects.modify(project, same_payer, [&](auto& col) {
        col.status = static_cast<uint8_t>(project_status::completed);
        col.update_ts = time_point_sec(current_time_point());
        col.end_ts = time_point_sec(current_time_point());
    });

}

//======================= proposal actions =========================

void telosbuild::newproposal(uint64_t project_id, name proposer, string title, uint64_t number_milestones, string timeline, string pdf, asset usd_amount, 
string mockups_link, string kanban_board_link) {
        
    //open config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    // //open profiles table, find profile
    // profiles_table profiles(get_self(), get_self().value);
    // auto prof_itr = profiles.get(proposer.value, "Proposer is not in the system");
    check(is_account(proposer), "Proposer is not in the system");

    //open proposals table
    proposals_table proposals(get_self(), get_self().value);
    
    //Authenticate
    require_auth(proposer);

    //Check that proposer has paid the bond
    profiles_table profiles(get_self(), get_self().value);
    auto prof = profiles.find(proposer.value);

    check(project.bond.amount == 0 || (prof != profiles.end() && prof->tlos_balance.amount >= project.bond.amount), "Proposer doesn't have enough funds");

    //Check usd amount is valid
    check(usd_amount.symbol == USD_SYM && usd_amount.amount > 0, "asset has to be USD and greater than zero");
    check(number_milestones > 0, "At least proposal needs to have 1 milestone");
    check(proposer != project.program_manager, "program_manager can't create a proposal for its own project");

    //Check proposing time is valid
    check(project.status == project_status::published, "Project must be published to accept proposals.");
    check(time_point_sec(current_time_point()) < project.propose_end_ts, "Proposing time has expired, cannot add new proposals.");

    //initialize
    uint64_t new_proposal_id = proposals.available_primary_key();

    //create new proposal
    proposals.emplace(proposer, [&](auto& col) {
        col.proposal_id = new_proposal_id;
        col.project_id = project_id;
        col.proposer = proposer;
        col.number_milestones = number_milestones;
        col.title = title;
        col.timeline = timeline;
        col.pdf = pdf;
        col.usd_amount = usd_amount;
        col.mockups_link = mockups_link;
        col.kanban_board_link = kanban_board_link;
        col.update_ts = time_point_sec(current_time_point());
    });

    if(project.bond.amount > 0) {
        conf.reserved_funds += project.bond;
        configs.set(conf, get_self());

        asset new_balance = prof->tlos_balance - project.bond;
        
        profiles.modify(prof, same_payer, [&](auto& col){
            col.tlos_balance = new_balance;
            col.locked_tlos_bonds += project.bond;
        });
    }
   
};

void telosbuild::editproposal(uint64_t proposal_id, optional<string> title, optional<string> timeline, optional<uint64_t> number_milestones,
    optional<string> pdf, optional<asset> usd_amount, optional<string> mockups_link, optional<string> kanban_board_link){
    //open config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open proposals table
    proposals_table proposals(get_self(), get_self().value);
    auto& proposal = proposals.get(proposal_id, "Proposal not found");

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(proposal.project_id, "Project not found");

    
    //Authenticate
    require_auth(proposal.proposer);

    //Check proposing time is valid
    check(project.status == project_status::published, "Project must be published to edit proposals.");
    check(proposal.status == proposal_status::drafting, "Proposal needs to be in drafting status to be edited");
    check(time_point_sec(current_time_point()) < project.propose_end_ts, "Proposing time has expired, cannot edit proposals.");

    string new_title = proposal.title;
    if(title) {
        new_title = *title;
    }

    string new_timeline = proposal.timeline;
    if (timeline) {
        new_timeline = *timeline;
    }

    string new_pdf = proposal.pdf;
    if (pdf) {
        new_pdf = *pdf;
    }

    string new_mockups_link = proposal.mockups_link;
    if (mockups_link) {
        new_mockups_link = *mockups_link;
    }

    string new_kanban_board_link = proposal.kanban_board_link;
    if (kanban_board_link) {
        new_kanban_board_link = *kanban_board_link;
    }

    uint64_t new_number_milestones = proposal.number_milestones;
    if(number_milestones) {
        check(number_milestones > 0, "At least proposal needs to have 1 milestone");
        new_number_milestones = *number_milestones;
    }

    asset new_usd_amount = proposal.usd_amount;
    if (usd_amount) {
        new_usd_amount = *usd_amount;
        check(usd_amount->symbol == USD_SYM && usd_amount->amount > 0, "asset has to be USD and greater than zero");
    }

    proposals.modify(proposal, same_payer, [&](auto& col) {
        col.title = new_title;
        col.timeline = new_timeline;
        col.number_milestones = new_number_milestones;
        col.pdf = new_pdf;
        col.usd_amount = new_usd_amount;
        col.mockups_link = new_mockups_link;
        col.kanban_board_link = new_kanban_board_link;
        col.update_ts = time_point_sec(current_time_point());
    });

};

// void telosbuild::sendproposal(uint64_t proposal_id) {
//     //open config
//     config_singleton configs(get_self(), get_self().value);
//     auto conf = configs.get();

//     //open proposals table
//     proposals_table proposals(get_self(), get_self().value);
//     auto& proposal = proposals.get(proposal_id, "Proposal not found");

//     //open project table, find project
//     projects_table projects(get_self(), get_self().value);
//     auto& project = projects.get(proposal.project_id, "Project not found");

//     //Authenticate
//     check(has_auth(proposal.proposer) || has_auth(conf.administrator), "Missing authority");

//     //Check proposing time is in published state
//     check(project.status == project_status::published, "Project must be in published state to erase a proposal.");
//     check(proposal.status == proposal_status::drafting, "Proposal must be in drafting state to send it.");

//     proposals.modify(proposal, same_payer, [&](auto& col) {
//         col.status = static_cast<uint8_t>(proposal_status::submitted);  
//         col.update_ts = time_point_sec(current_time_point());
//     });
// };


void telosbuild::rmvproposal(uint64_t proposal_id){
    //open proposals table
    proposals_table proposals(get_self(), get_self().value);
    auto& proposal = proposals.get(proposal_id, "Proposal not found");

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(proposal.project_id, "Project not found");

    //Authenticate
    check(has_auth(proposal.proposer), "Missing authority");

    //Check proposing time is in published state
    check(project.status == project_status::published, "Project must be in published state to erase a proposal.");
    check(time_point_sec(current_time_point()) <= project.propose_end_ts, "Proposal can not be removed after proposing time has ended");

    proposals.erase(proposal);

};

void telosbuild::returnbond(uint64_t proposal_id, bool return_bond) {

    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open proposals table
    proposals_table proposals(get_self(), get_self().value);
    auto& proposal = proposals.get(proposal_id, "Proposal not found");

    //open projects table
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(proposal.project_id, "Project not found");

    //open profiles table
    profiles_table profiles(get_self(), get_self().value);
    auto& prof = profiles.get(proposal.proposer.value);

    check(proposal.status == proposal_status::drafting, "Can only return bond if proposal is in drafting status");
    check(time_point_sec(current_time_point()) >= project.propose_end_ts, "Can only return bond if proposing period has ended");
    
    profiles.modify(prof, same_payer, [&](auto& col){
        col.locked_tlos_bonds -= project.bond;
    });

    if(!return_bond) {
        proposals.modify(proposal, get_self(), [&](auto& col) {
            col.status = static_cast<uint8_t>(proposal_status::spam);
            col.update_ts = time_point_sec(current_time_point());
        });

        conf.reserved_funds -= project.bond;
        conf.available_funds += project.bond;
        configs.set(conf, get_self());

    } else {
        proposals.modify(proposal, get_self(), [&](auto& col) {
            col.status = static_cast<uint8_t>(proposal_status::accepted);
            col.update_ts = time_point_sec(current_time_point());
        });

        //open project table, find project
        projects_table projects(get_self(), get_self().value);
        auto& project = projects.get(proposal.project_id, "Project not found");

        if(project.bond.amount > 0) {
            conf.reserved_funds -= project.bond;
            configs.set(conf, get_self());
            
            //inline transfer
            action(permission_level{get_self(), name("active")}, name("eosio.token"), name("transfer"), make_tuple(
                get_self(), //from
                proposal.proposer, //to
                project.bond, //quantity
                std::string("Telos Works Return Bond") //memo
            )).send();
        }
        
    }
}

//========================= voting actions ============================

void telosbuild::skipvoting(uint64_t project_id, uint64_t proposal_selected, vector<uint64_t> proposals_rewarded)
{
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    //open proposals table
    proposals_table proposals(get_self(), get_self().value);

    require_auth(project.program_manager);

    check(project.status == project_status::published, "Project must be published to skip voting.");
    check(time_point_sec(current_time_point()) > project.propose_end_ts, "Can't select proposal until proposing time has ended");

    auto project_idx = proposals.get_index<name("byproject")>();
    auto itr_start = project_idx.lower_bound(project_id);
    auto itr_end = project_idx.upper_bound(project_id); 

    while( itr_start != itr_end ) {
        check(itr_start->status != proposal_status::drafting, "All proposals need to be set as accepted or spam before voting");
        ++itr_start;
    }

    //Check that proposals selected and proposals rewarded are valid
    auto proposal = proposals.find(proposal_selected);
    check(proposal != proposals.end(), "Proposal selected not found");
    for(auto i = 0; i < proposals_rewarded.size(); ++i) {
        auto prop_rewarded_itr = proposals.find(proposals_rewarded[i]);
        check(proposals.find(proposals_rewarded[i]) != proposals.end(), "Proposal rewarded " + to_string(proposals_rewarded[i]) + " not found");
        if(proposal == prop_rewarded_itr) {
            proposals.modify(prop_rewarded_itr, get_self(), [&](auto& col) {
                col.status = static_cast<uint8_t>(proposal_status::selected);
                col.update_ts = time_point_sec(current_time_point());
            });
        } else {
            proposals.modify(prop_rewarded_itr, get_self(), [&](auto& col) {
                col.status = static_cast<uint8_t>(proposal_status::rewarded);
                col.update_ts = time_point_sec(current_time_point());
            });
        }
    }
    
    check(proposals_rewarded.size() <= project.number_proposals_rewarded, 
        "Proposals rewarded size must match with the number of proposals rewarded");
    check(std::find(proposals_rewarded.begin(), proposals_rewarded.end(), proposal_selected) != proposals_rewarded.end(),
        "Proposal selected must be included in proposals_rewarded");
    
    projects.modify(project, same_payer, [&](auto& col) {
        col.status = static_cast<uint8_t>(project_status::selected);
        col.proposals_rewarded = proposals_rewarded;
        col.project_manager = proposal->proposer;
        col.proposal_selected = vector<uint64_t>{proposal_selected};
        col.update_ts = time_point_sec(current_time_point());
    });
}

void telosbuild::beginvoting(uint64_t project_id, name ballot_name, optional<bool> cancel)
{  
    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    //validate
    check(project.status == project_status::published, "Project must be in published status");
    check(time_point_sec(current_time_point()) > project.propose_end_ts, "Can't start voting process until proposing time has ended.");

    auto projects_by_ballot = projects.get_index<name("byballot")>();
    auto by_ballot_itr = projects_by_ballot.find(ballot_name.value);
    check(by_ballot_itr == projects_by_ballot.end(), "Ballot name already used");

    //authenticate
    require_auth(project.program_manager);

    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //initialize
    time_point_sec now = time_point_sec(current_time_point());
    time_point_sec ballot_end_time = now + project.voting_days*86400;


    //open proposals table
    proposals_table proposals(get_self(), get_self().value);
    
    //Get ballot options
    vector<name> ballot_options = {};
    
    auto project_idx = proposals.get_index<name("byproject")>();
    auto itr_start = project_idx.lower_bound(project_id);
    auto itr_end = project_idx.upper_bound(project_id); 

    while( itr_start != itr_end ) {
        check(itr_start->status != proposal_status::drafting, "All proposals need to be set as accepted or spam before voting");
        if(itr_start->status == proposal_status::accepted){
            ballot_options.push_back(name(itr_start->proposal_id));
        }
        ++itr_start;
    }


    bool cancel_project = true;
    if (cancel) {
        cancel_project = *cancel;
    }

    if(ballot_options.size() == 0) {
        if(cancel_project) {
            projects.modify(project, same_payer, [&](auto& col) {
                col.status = static_cast<uint8_t>(project_status::cancelled);
                col.update_ts = time_point_sec(current_time_point());
                col.vote_end_ts = time_point_sec(current_time_point());
            });
        } else {
            projects.modify(project, same_payer, [&](auto& col) {
                col.status = static_cast<uint8_t>(project_status::published);
                col.propose_end_ts =  time_point_sec(current_time_point()) + project.proposing_days*86400;
                col.update_ts = time_point_sec(current_time_point());
            });
        }
    } else if(ballot_options.size() == 1) {

        auto tlosusd = tlosusdprice();
        float tlos_amount = float(project.usd_rewarded.amount*10000 / tlosusd);
        auto tlos_locked = asset(2*tlos_amount, TLOS_SYM);

        auto proposal = proposals.find(ballot_options[0].value);

        if(cancel_project) {
            projects.modify(project, same_payer, [&](auto& col) {
                col.status = static_cast<uint8_t>(project_status::cancelled);
                col.tlos_locked = tlos_locked;
                col.proposals_rewarded = vector<uint64_t>{proposal->proposal_id};
                col.update_ts = time_point_sec(current_time_point());
                col.vote_end_ts = time_point_sec(current_time_point());
            });

            proposals.modify(proposal, same_payer, [&](auto& col) {
                col.status = static_cast<uint8_t>(proposal_status::rewarded);
                col.update_ts = time_point_sec(current_time_point());
            });

            auto total_telos_rewarded = asset(project.tlos_locked.amount, TLOS_SYM);
            check(conf.available_funds.amount >= total_telos_rewarded.amount, "Telos Works has insufficient available funds");

            //open profiles table 
            profiles_table profiles(get_self(), get_self().value);

            auto user_rewarded = proposal->proposer;

            auto prof = profiles.find(user_rewarded.value);
            if(prof != profiles.end()) {
                profiles.modify(prof, get_self(), [&](auto& col) {
                    col.locked_tlos_balance += tlos_locked;
                });
            } else {
                profiles.emplace(get_self(), [&](auto& col) {
                    col.account = user_rewarded;
                    col.locked_tlos_balance = tlos_locked;
                });
            }
        
            string memo = string("TLOS rewarded for proposal " + to_string(proposal->proposal_id) 
                + " for project " + to_string(project_id));

            locked_tlos_table lockedtlos(get_self(), user_rewarded.value);

            uint64_t new_locked_id = lockedtlos.available_primary_key();

            lockedtlos.emplace(get_self(), [&](auto& col) {
                col.locked_id = new_locked_id;
                col.tlos_amount = tlos_locked;
                col.locked_until_ts =  time_point_sec(current_time_point()) + conf.tlos_locked_time*86400;
                col.memo = memo;
            });

        } else {
            projects.modify(project, same_payer, [&](auto& col) {
                col.proposals_rewarded = vector<uint64_t>{proposal->proposal_id};
                col.proposal_selected = vector<uint64_t>{proposal->proposal_id};
                col.status = static_cast<uint8_t>(project_status::selected);
                col.update_ts = time_point_sec(current_time_point());
                col.vote_end_ts = time_point_sec(current_time_point());
            });

            proposals.modify(proposal, same_payer, [&](auto& col) {
                col.status = static_cast<uint8_t>(proposal_status::selected);
                col.update_ts = time_point_sec(current_time_point());
            });

        }
    } else {
        
        telosdecide::config_singleton configdecide(TELOSDECIDE, TELOSDECIDE.value);
        auto confdecide = configdecide.get();
        asset newballot_fee = confdecide.fees.at(name("ballot"));
        check(conf.available_funds.amount >= newballot_fee.amount, "Telos Works has insufficient available funds");


        //update project
        projects.modify(project, same_payer, [&](auto& col) {
            col.status = static_cast<uint8_t>(project_status::voting);
            col.ballot_name = ballot_name;
            col.update_ts = time_point_sec(current_time_point());
            col.vote_end_ts = ballot_end_time;
        });

        //update and set config
        conf.available_funds -= newballot_fee;
        configs.set(conf, get_self());

        //send inline transfer to pay for newballot fee
        action(permission_level{get_self(), name("active")}, name("eosio.token"), name("transfer"), make_tuple(
            get_self(), //from
            TELOSDECIDE, //to
            newballot_fee, //quantity
            string("Decide New Ballot Fee Payment") //memo
        )).send();

        //send inline newballot to decide
        action(permission_level{get_self(), name("active")}, TELOSDECIDE, name("newballot"), make_tuple(
            ballot_name, //ballot_name
            name("leaderboard"), //category
            get_self(), //publisher
            VOTE_SYM, //treasury_symbol
            name("1token1vote"), //voting_method
            ballot_options //initial_options
        )).send();

        //send inline editdetails to decide
        action(permission_level{get_self(), name("active")}, TELOSDECIDE, name("editdetails"), make_tuple(
            ballot_name, //ballot_name
            string(project.title), //title
            string(project.description), //description
            string("") //content
        )).send();

        //toggle ballot votestake on (default is off)
        action(permission_level{get_self(), name("active")}, TELOSDECIDE, name("togglebal"), make_tuple(
            ballot_name, //ballot_name
            name("votestake") //setting_name
        )).send();


        //send inline openvoting to decide
        action(permission_level{get_self(), name("active")}, TELOSDECIDE, name("openvoting"), make_tuple(
            ballot_name, //ballot_name
            ballot_end_time //end_time
        )).send();
    }
}

void telosbuild::endvoting(uint64_t project_id)
{
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    //authenticate
    check(has_auth(project.program_manager) || has_auth(conf.administrator), "requires program_manager or admin to authenticate");

    //validate
    check(project.status == project_status::voting, "Project status must be in voting state");
    check(time_point_sec(current_time_point()) > project.vote_end_ts, "Vote time has not ended");

    //send inline closevoting to decide
    action(permission_level{get_self(), name("active")}, TELOSDECIDE, name("closevoting"), make_tuple(
        project.ballot_name, //ballot_name
        true //broadcast
    )).send();

    //NOTE: results processed in catch_broadcast()

}


void telosbuild::pickproposal(uint64_t project_id, uint64_t proposal_id)
{
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    //authenticate
    require_auth(project.program_manager);

    //validate
    check(project.status == project_status::voted, "Project must be in voted status");
    check(std::find(project.proposals_rewarded.begin(), project.proposals_rewarded.end(), proposal_id) 
        != project.proposals_rewarded.end(), "Proposal selected must be one of the proposals rewarded");
    
    //open proposals table
    proposals_table proposals(get_self(), get_self().value);
    auto proposal = proposals.find(proposal_id);

    proposals.modify(proposal, get_self(), [&](auto& col) {
        col.status = static_cast<uint8_t>(proposal_status::selected);
        col.update_ts = time_point_sec(current_time_point());
    });

    projects.modify(project, same_payer, [&](auto& col) {
        col.status = static_cast<uint8_t>(project_status::selected);
        col.project_manager = proposal->proposer;
        col.proposal_selected = vector<uint64_t>{proposal_id};
        col.update_ts = time_point_sec(current_time_point());
    });

    
}

//========================== milestones actions =========================

void telosbuild::sendreport(uint64_t project_id, uint64_t milestone_id, string title, string description, string documents) {

    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    //open proposals table
    proposals_table proposals(get_self(), get_self().value);
    auto& proposal = proposals.get(project.proposal_selected[0], "Proposal not found");

    check(project.status == project_status::started, "Project is not in started status, cannot update milestones");

    require_auth(project.project_manager);

    //open milestones table
    milestones_table milestones(get_self(), project_id);
    auto& milestone = milestones.get(milestone_id, "Milestone not found");

    auto now = time_point_sec(current_time_point());

    check(milestone.status == milestone_status::pending, "A report has already been sent.");
    check(now >= milestone.start_ts, "Cannot send a report before the milestone starts");

    auto tlosusd = tlosusdprice();
    float tlos_amount = float(conf.reward_percentage*10000*proposal.usd_amount.amount / tlosusd);
    auto tlos_locked = asset(2*tlos_amount, TLOS_SYM);

    milestones.modify(milestone, get_self(), [&](auto& col) {
        col.status =  static_cast<uint8_t>(milestone_status::sent);
        col.send_ts = now;
        col.title = title;
        col.description = description;
        col.documents = documents;
        col.tlos_rewarded = tlos_locked;
    });
}

void telosbuild::reviewreport(uint64_t project_id, uint64_t milestone_id, bool pay_reward) {
    
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    require_auth(project.program_manager);

    check(project.status == project_status::started, "Project is not in started status, cannot review milestones");

    //open milestones table
    milestones_table milestones(get_self(), project_id);
    auto& milestone = milestones.get(milestone_id, "Milestone not found");

    auto now = time_point_sec(current_time_point());

    check(milestone.status == milestone_status::sent, "Milestone must be in sent status to review it");
    check(now >= milestone.end_ts, "Cannot review a milestone before it has finished its time");
    check((pay_reward && milestone.send_ts >= milestone.start_ts 
    && milestone.send_ts < milestone.end_ts) || !pay_reward, "Can only pay reward if milestone is sent on time.");

    if(pay_reward) {

        check(conf.available_funds.amount >= milestone.tlos_rewarded.amount, "Telos Works has insufficient available funds");

        //update config funds
        conf.available_funds -= milestone.tlos_rewarded;
        conf.reserved_funds += milestone.tlos_rewarded;
        configs.set(conf, get_self());

        milestones.modify(milestone, get_self(), [&](auto& col) {
            col.status =  static_cast<uint8_t>(milestone_status::reviewed);
            col.review_ts = now;
        });

    } else {
         milestones.modify(milestone, get_self(), [&](auto& col) {
            col.status =  static_cast<uint8_t>(milestone_status::reviewed);
            col.review_ts = now;
            col.tlos_rewarded = asset(0, TLOS_SYM);
        });
    }   
}


//======================== notification handlers ========================

void telosbuild::catch_transfer(name from, name to, asset quantity, string memo)
{   

    if(quantity.symbol != TLOS_SYM) return;

    //if notification from eosio.token, transfer to self, and TLOS symbol
    if (to == get_self()) {
        //skips emplacement if memo is skip
        if (memo == std::string("fund")) {
            //open config singleton, get config
            config_singleton configs(get_self(), get_self().value);
            auto conf = configs.get();

            //adds to available funds
            conf.available_funds += quantity;
            configs.set(conf, get_self());
        } else {
            //open accounts table, get account
            profiles_table profiles(get_self(), get_self().value);
            auto prof = profiles.find(from.value);

            //emplace account if not found, update if exists
            if (prof == profiles.end()) {
                //make new account entry
                profiles.emplace(get_self(), [&](auto& col) {
                    col.account = from;
                    col.tlos_balance = quantity;
                });
            } else {
                //update existing account
                profiles.modify(prof, same_payer, [&](auto& col) {
                    col.tlos_balance += quantity;
                });
            }
        }       
    }
}

void telosbuild::catch_broadcast(name ballot_name, map<name, asset> final_results, uint32_t total_voters)
{   

    //get initial receiver contract
    name rec = get_first_receiver();

    //if notification not from decide account
    if (rec != TELOSDECIDE) {
        return;
    }

    //open proposals table, get by ballot index, find proposal
    projects_table projects(get_self(), get_self().value);
    auto projects_by_ballot = projects.get_index<name("byballot")>();
    auto by_ballot_itr = projects_by_ballot.find(ballot_name.value);

    //if proposal found
    if (by_ballot_itr != projects_by_ballot.end()) {

        //open config singleton, get config
        config_singleton configs(get_self(), get_self().value);
        auto conf = configs.get();

        //validate
        check(time_point_sec(current_time_point()) > by_ballot_itr->vote_end_ts, "Vote time has not ended");
        check(by_ballot_itr->status == project_status::voting, "Project must be in voting state to end voting");

        //get proposals selected and rewarded
        vector<pair<name, asset>> pairs;
        for (auto itr = final_results.begin(); itr != final_results.end(); ++itr){
            pairs.push_back(*itr);
        }

        sort(pairs.begin(), pairs.end(), [=](pair<name, asset>& a, std::pair<name, asset>& b)
        {
            return a.second.amount > b.second.amount;
        });

        vector<uint64_t> proposals_rewarded = vector<uint64_t>{};
        auto num_proposals_rewarded =  pairs.size() <= by_ballot_itr->number_proposals_rewarded 
            ? pairs.size()
            : by_ballot_itr->number_proposals_rewarded;

        proposals_table proposals(get_self(), get_self().value);
        for(auto i = 0; i < num_proposals_rewarded; ++i) {
            proposals_rewarded.push_back(pairs[i].first.value);
            auto& prop_itr = proposals.get(pairs[i].first.value, "Proposal not found");
            proposals.modify(prop_itr, get_self(), [&](auto& col) {
                col.status = static_cast<uint8_t>(proposal_status::rewarded);
                col.update_ts = time_point_sec(current_time_point());
            });
        }
        
        projects.modify(*by_ballot_itr, same_payer, [&](auto& col) {
            col.status = static_cast<uint8_t>(project_status::voted);
            col.proposals_rewarded = proposals_rewarded;
            col.update_ts = time_point_sec(current_time_point());
        });
    }
}

//======================== functions ========================

uint64_t telosbuild::tlosusdprice() {
  delphioracle::datapoints_table _datapoints(name("delphioracle"), name("tlosusd").value);
  auto itr = _datapoints.find(1);
  return itr -> median;
}

//======================= wipe actions ====================


// void telosbuild::wipeconf()
// {
//     config_singleton configs(get_self(), get_self().value);
//     configs.remove();
// }

// void telosbuild::wipeprojects() {
//     projects_table projects(get_self(), get_self().value);
//     auto project_itr = projects.begin();
//     while(project_itr != projects.end()) {
//         project_itr = projects.erase(project_itr);
//     }
// }

//======================= test actions ====================

void telosbuild::skpstartvote(uint64_t project_id){
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    require_auth(project.program_manager);

    projects.modify(project, get_self(), [&](auto& col){
        col.propose_end_ts = time_point_sec(current_time_point());
    });
}

void telosbuild::skpmilestone(uint64_t project_id, uint64_t milestone_id){
    //open config singleton, get config
    config_singleton configs(get_self(), get_self().value);
    auto conf = configs.get();

    //open project table, find project
    projects_table projects(get_self(), get_self().value);
    auto& project = projects.get(project_id, "Project not found");

    require_auth(project.program_manager);

    //open milestones table
    milestones_table milestones(get_self(), project_id);
    auto& milestone = milestones.get(milestone_id, "Milestone not found");

    milestones.modify(milestone, get_self(), [&](auto& col) {
        col.start_ts = time_point_sec(current_time_point());
    });
}

// void telosbuild::copytables() {
//     config_singleton oldconfigs(name("testtloswork"), name("testtloswork").value);
//     config_singleton configs(get_self(), get_self().value);

//     auto conf = oldconfigs.get();

//     configs.set(conf, get_self());

//     profiles_table oldprofiles(name("testtloswork"), name("testtloswork").value);
//     profiles_table profiles(get_self(), get_self().value);

//     auto profiles_itr = oldprofiles.begin();
//     while(profiles_itr != oldprofiles.end()) {
//         profiles.emplace(get_self(), [&](auto& col) {
//             col.account = profiles_itr->account;
//             col.tlos_balance = profiles_itr->tlos_balance;
//             col.locked_tlos_balance = profiles_itr->locked_tlos_balance;
//             col.locked_tlos_bonds = profiles_itr->locked_tlos_bonds;
//         });
//         ++profiles_itr;
//     }

//     projects_table oldprojects(name("testtloswork"), name("testtloswork").value);
//     projects_table projects(get_self(), get_self().value);

//     auto project_itr = oldprojects.begin();
//     while(project_itr != oldprojects.end()) {
//         projects.emplace(get_self(), [&](auto& col){
//             col.project_id = project_itr->project_id;
//             col.title = project_itr->title;
//             col.ballot_name = project_itr->ballot_name;
//             col.status = project_itr->status;
//             col.program_manager = project_itr->program_manager;
//             col.project_manager = project_itr->project_manager;
//             col.bond = project_itr->bond;
//             col.description = project_itr->description;
//             col.github_url = project_itr->github_url;
//             col.usd_rewarded = project_itr->usd_rewarded;
//             col.tlos_locked = project_itr->tlos_locked;
//             col.number_proposals_rewarded = project_itr->number_proposals_rewarded;
//             col.proposals_rewarded = project_itr->proposals_rewarded;
//             col.proposal_selected = project_itr->proposal_selected;
//             col.proposing_days = project_itr->proposing_days;
//             col.voting_days = project_itr->voting_days;
//             col.update_ts = project_itr->update_ts;
//             col.propose_end_ts = project_itr->propose_end_ts;
//             col.vote_end_ts = project_itr->vote_end_ts;
//             col.start_ts = project_itr->start_ts;
//             col.end_ts = project_itr->end_ts;
//         });

//         milestones_table oldmilestones(name("testtloswork"), project_itr->project_id);
//         milestones_table milestones(get_self(), project_itr->project_id);

//         auto milestone_itr = oldmilestones.begin();
//         while(milestone_itr != oldmilestones.end()) {
//             milestones.emplace(get_self(), [&](auto& col){
//                 col.milestone_id = milestone_itr->milestone_id;
//                 col.status = milestone_itr->status;
//                 col.tlos_rewarded = milestone_itr->tlos_rewarded;
//                 col.title = milestone_itr->title;
//                 col.description = milestone_itr->description;
//                 col.documents = milestone_itr->documents;
//                 col.start_ts = milestone_itr->start_ts;
//                 col.end_ts = milestone_itr->end_ts;
//                 col.send_ts = milestone_itr->send_ts;
//                 col.review_ts = milestone_itr->review_ts;
//             });
//             ++milestone_itr;
//         }

//         ++project_itr;
//     }

//     proposals_table oldproposals(name("testtloswork"), name("testtloswork").value);
//     proposals_table proposals(get_self(), get_self().value);

//     auto proposal_itr = oldproposals.begin();
//     while(proposal_itr != oldproposals.end()) {
//         proposals.emplace(get_self(), [&](auto& col) {
//             col.proposal_id = proposal_itr->proposal_id;
//             col.proposer = proposal_itr->proposer;
//             col.status = proposal_itr->status;
//             col.number_milestones = proposal_itr->number_milestones;
//             col.title = proposal_itr->title;
//             col.timeline = proposal_itr->timeline;
//             col.pdf = proposal_itr->pdf;
//             col.usd_amount = proposal_itr->usd_amount;
//             col.mockups_link = proposal_itr->mockups_link;
//             col.kanban_board_link = proposal_itr->kanban_board_link;
//             col.update_ts = proposal_itr->update_ts;
//         });

//         ++proposal_itr;
//     }
// }
