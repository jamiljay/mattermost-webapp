// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';
import {injectIntl} from 'react-intl';

import {Permissions} from 'mattermost-redux/constants';

import * as GlobalActions from 'actions/global_actions';
import {Constants, ModalIdentifiers} from 'utils/constants';
import {intlShape} from 'utils/react_intl';
import {cmdOrCtrlPressed, isKeyPressed} from 'utils/utils';
import {useSafeUrl} from 'utils/url';
import * as UserAgent from 'utils/user_agent';
import InvitationModal from 'components/invitation_modal';

import TeamPermissionGate from 'components/permissions_gates/team_permission_gate';
import SystemPermissionGate from 'components/permissions_gates/system_permission_gate';

import LeaveTeamIcon from 'components/widgets/icons/leave_team_icon';

import LeaveTeamModal from 'components/leave_team_modal';
import UserSettingsModal from 'components/user_settings/modal';
import TeamMembersModal from 'components/team_members_modal';
import TeamSettingsModal from 'components/team_settings_modal';
import AboutBuildModal from 'components/about_build_modal';
import AddGroupsToTeamModal from 'components/add_groups_to_team_modal';
import MarketplaceModal from 'components/plugin_marketplace';

import Menu from 'components/widgets/menu/menu';
import TeamGroupsManageModal from 'components/team_groups_manage_modal';

import withGetCloudSubscription from '../common/hocs/cloud/with_get_cloud_subcription';

class MainMenu extends React.PureComponent {
    static propTypes = {
        mobile: PropTypes.bool.isRequired,
        id: PropTypes.string,
        teamId: PropTypes.string,
        teamName: PropTypes.string,
        siteName: PropTypes.string,
        currentUser: PropTypes.object,
        appDownloadLink: PropTypes.string,
        enableCommands: PropTypes.bool.isRequired,
        enableCustomEmoji: PropTypes.bool.isRequired,
        enableIncomingWebhooks: PropTypes.bool.isRequired,
        enableOAuthServiceProvider: PropTypes.bool.isRequired,
        enableOutgoingWebhooks: PropTypes.bool.isRequired,
        canManageSystemBots: PropTypes.bool.isRequired,
        canCreateOrDeleteCustomEmoji: PropTypes.bool.isRequired,
        canManageIntegrations: PropTypes.bool.isRequired,
        enablePluginMarketplace: PropTypes.bool.isRequired,
        experimentalPrimaryTeam: PropTypes.string,
        helpLink: PropTypes.string,
        reportAProblemLink: PropTypes.string,
        moreTeamsToJoin: PropTypes.bool.isRequired,
        pluginMenuItems: PropTypes.arrayOf(PropTypes.object),
        isMentionSearch: PropTypes.bool,
        teamIsGroupConstrained: PropTypes.bool.isRequired,
        isLicensedForLDAPGroups: PropTypes.bool,
        showGettingStarted: PropTypes.bool.isRequired,
        intl: intlShape.isRequired,
        showNextStepsTips: PropTypes.bool,
        isCloud: PropTypes.bool,
        subscriptionStats: PropTypes.object,
        firstAdminVisitMarketplaceStatus: PropTypes.bool,
        actions: PropTypes.shape({
            openModal: PropTypes.func.isRequred,
            showMentions: PropTypes.func,
            showFlaggedPosts: PropTypes.func,
            closeRightHandSide: PropTypes.func.isRequired,
            closeRhsMenu: PropTypes.func.isRequired,
            unhideNextSteps: PropTypes.func.isRequired,
            getSubscriptionStats: PropTypes.func.isRequired,
        }).isRequired,
    };

    static defaultProps = {
        teamType: '',
        mobile: false,
        pluginMenuItems: [],
    };

    toggleShortcutsModal = (e) => {
        e.preventDefault();
        GlobalActions.toggleShortcutsModal();
    }

    async componentDidMount() {
        document.addEventListener('keydown', this.handleKeyDown);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    handleKeyDown = (e) => {
        if (cmdOrCtrlPressed(e) && e.shiftKey && isKeyPressed(e, Constants.KeyCodes.A)) {
            this.props.actions.openModal({ModalId: ModalIdentifiers.USER_SETTINGS, dialogType: UserSettingsModal});
        }
    }

    handleEmitUserLoggedOutEvent = () => {
        GlobalActions.emitUserLoggedOutEvent();
    }

    getFlagged = (e) => {
        e.preventDefault();
        this.props.actions.showFlaggedPosts();
        this.props.actions.closeRhsMenu();
    }

    searchMentions = (e) => {
        e.preventDefault();

        if (this.props.isMentionSearch) {
            this.props.actions.closeRightHandSide();
        } else {
            this.props.actions.closeRhsMenu();
            this.props.actions.showMentions();
        }
    }

    shouldShowUpgradeModal = () => {
        const {subscriptionStats, isCloud} = this.props;

        if (subscriptionStats?.is_paid_tier === 'true') { // eslint-disable-line camelcase
            return false;
        }
        return isCloud && subscriptionStats?.remaining_seats <= 0;
    }

    render() {
        const {currentUser, teamIsGroupConstrained, isLicensedForLDAPGroups} = this.props;

        if (!currentUser) {
            return null;
        }

        const pluginItems = this.props.pluginMenuItems.map((item) => {
            return (
                <Menu.ItemAction
                    id={item.id + '_pluginmenuitem'}
                    key={item.id + '_pluginmenuitem'}
                    onClick={() => {
                        if (item.action) {
                            item.action();
                        }
                    }}
                    text={item.text}
                    icon={this.props.mobile && item.mobileIcon}
                />
            );
        });

        const someIntegrationEnabled = this.props.enableIncomingWebhooks || this.props.enableOutgoingWebhooks || this.props.enableCommands || this.props.enableOAuthServiceProvider || this.props.canManageSystemBots;
        const showIntegrations = !this.props.mobile && someIntegrationEnabled && this.props.canManageIntegrations;

        const {formatMessage} = this.props.intl;

        const invitePeopleModal = (
            <Menu.ItemToggleModalRedux
                id='invitePeople'
                modalId={ModalIdentifiers.INVITATION}
                dialogType={InvitationModal}
                text={formatMessage({
                    id: 'navbar_dropdown.invitePeople',
                    defaultMessage: 'Invite People',
                })}
                extraText={formatMessage({
                    id: 'navbar_dropdown.invitePeopleExtraText',
                    defaultMessage: 'Add or invite people to the team',
                })}
                icon={this.props.mobile && <i className='fa fa-user-plus'/>}
            />
        );

        return (
            <Menu
                mobile={this.props.mobile}
                id={this.props.id}
                ariaLabel={formatMessage({id: 'navbar_dropdown.menuAriaLabel', defaultMessage: 'main menu'})}
            >
                <Menu.Group>
                    <Menu.ItemAction
                        id='logout'
                        onClick={this.handleEmitUserLoggedOutEvent}
                        text={formatMessage({id: 'navbar_dropdown.logout', defaultMessage: 'Log Out'})}
                        icon={this.props.mobile && <i className='fa fa-sign-out'/>}
                    />
                </Menu.Group>
            </Menu>
        );
    }
}

export default injectIntl(withGetCloudSubscription((MainMenu)));
