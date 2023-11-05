import React, { memo, useRef, useEffect } from 'react';
import { connect } from 'umi';
import classnames from 'classnames';

import { IConnectionModelType } from '@/models/connection';
import { IWorkspaceModelType } from '@/models/workspace';
import { ConsoleOpenedStatus } from '@/constants';
import { useWorkspaceStore } from '@/store/workspace';

import DraggableContainer from '@/components/DraggableContainer';
import WorkspaceHeader from './components/WorkspaceHeader';
import WorkspaceLeft from './components/WorkspaceLeft';
import WorkspaceRight from './components/WorkspaceRight';
import LoadingContent from '@/components/Loading/LoadingContent';

import { copy, tableCopy } from '@/utils'

import styles from './index.less';

interface IProps {
  className?: string;
  workspaceModel: IWorkspaceModelType['state'];
  connectionModel: IConnectionModelType['state'];
  pageLoading: any;
  dispatch: any;
}

const dvaModel = connect(
  ({ connection, workspace }: { connection: IConnectionModelType; workspace: IWorkspaceModelType }) => ({
    connectionModel: connection,
    workspaceModel: workspace,
  }),
);

const workspacePage = memo<IProps>((props) => {
  const draggableRef = useRef<any>();
  const { workspaceModel, connectionModel, dispatch } = props;
  const { curConnection } = connectionModel;
  const { curWorkspaceParams } = workspaceModel;
  const { panelLeft, panelLeftWidth, focusedContent } = useWorkspaceStore((state) => {
    return {
      panelLeft: state.layout.panelLeft,
      panelLeftWidth: state.layout.panelLeftWidth,
      focusedContent: state.focusedContent,
    }
  });

  const isReady =
    curWorkspaceParams?.dataSourceId &&
    (curWorkspaceParams?.databaseName ||
      curWorkspaceParams?.schemaName ||
      (curWorkspaceParams?.databaseName === null && curWorkspaceParams?.schemaName === null));

  useEffect(() => {
    clearData();
  }, [curConnection]);

  useEffect(() => {
    if (isReady) {
      getConsoleList();
    }
  }, [curWorkspaceParams]);

  // 注册快捷键监听cmd+c或ctrl+c复制focusedContent
  useEffect(() => {
    const handleCopy = (e: KeyboardEvent) => {
      if (e.key === 'c' && (e.metaKey || e.ctrlKey)) {
        if (!focusedContent) return
        // 如果是数据是数组，就调用tableCopy
        if (Array.isArray(focusedContent)) {
          tableCopy(focusedContent as any)
          return
        }
        copy(focusedContent as any)
      }
    };
    document.addEventListener('keydown', handleCopy);
    return () => {
      document.removeEventListener('keydown', handleCopy);
    };
  }, [focusedContent]);

  function clearData() {
    dispatch({
      type: 'workspace/setOpenConsoleList',
      payload: [],
    });
    dispatch({
      type: 'workspace/setConsoleList',
      payload: [],
    });
    dispatch({
      type: 'workspace/setDatabaseAndSchema',
      payload: undefined,
    });
    dispatch({
      type: 'workspace/setCurTableList',
      payload: [],
    });
  }

  function getConsoleList() {
    const p = {
      pageNo: 1,
      pageSize: 999,
      tabOpened: ConsoleOpenedStatus.IS_OPEN,
      ...curWorkspaceParams,
    };

    dispatch({
      type: 'workspace/fetchGetSavedConsoleLoading',
      payload: p,
      callback: (res: any) => {
        dispatch({
          type: 'workspace/setOpenConsoleList',
          payload: res.data,
        });
      },
    });
  }

  return (
    <div className={styles.workspace}>
      <WorkspaceHeader />
      <LoadingContent className={styles.loadingContent} coverLoading={true} isLoading={false}>
        <DraggableContainer className={styles.workspaceMain}>
          <div
            ref={draggableRef}
            style={{ '--panel-left-width': `${panelLeftWidth}px` } as any}
            className={classnames({ [styles.hiddenPanelLeft]: !panelLeft }, styles.boxLeft)}
          >
            <WorkspaceLeft />
          </div>
          <div className={styles.boxRight}>
            <WorkspaceRight />
          </div>
        </DraggableContainer>
      </LoadingContent>
    </div>
  );
});

export default dvaModel(workspacePage);
