import { AbilityBuilder, Ability } from '@casl/ability'

export const ability =
    AbilityBuilder.define(can => {
       // can('load', 'all');
    });

export function defineAbilityFor(session) {
    const { rules, can, cannot } = AbilityBuilder.extract();

    can('load', 'all'); //detect if page was reloaded
   
    if (session.read === 'Allow') {
        can('read', 'Allow');
    }
    if (session.download === 'Allow') {
        can('download', 'Allow');
    }
    if (session.delete === 'Allow') {
        can('delete', 'Allow');
    }
    if (session.upload === 'Allow') {
        can('upload', 'Allow');
    }

    switch(session.role) {
        case 'SuperAdmin':
            can('role', 'SuperAdmin');
            break;
        case 'User':
            can('role', 'User');
            break;
        // Add more roles here
    }
   
    return new Ability(rules);
}