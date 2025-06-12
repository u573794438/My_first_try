import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Switch, Tag, Typography, message, Spin, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from '../../utils/axios';

const { Title, Text } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState(null);
  const [departments, setDepartments] = useState([]);

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      if (response.data.success) {
        setUsers(response.data.data);
        // 提取所有部门用于筛选
        const depts = Array.from(new Set(response.data.data.map(user => user.department)));
        setDepartments(depts);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 显示添加/编辑用户模态框
  const showModal = (user = null) => {
    setEditingUser(user);
    if (user) {
      // 编辑现有用户
      form.setFieldsValue({
        name: user.name,
        employeeId: user.employeeId,
        department: user.department,
        role: user.role,
        wechatId: user.wechatId,
        isActive: user.isActive
      });
    } else {
      // 添加新用户
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  // 关闭模态框
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
  };

  // 保存用户信息
  const handleSaveUser = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingUser) {
        // 更新现有用户
        const response = await axios.put(`/api/users/${editingUser._id}`, values);
        if (response.data.success) {
          message.success('用户信息更新成功');
        }
      } else {
        // 创建新用户
        const response = await axios.post('/api/users', values);
        if (response.data.success) {
          message.success('新用户添加成功');
        }
      }

      setIsModalVisible(false);
      fetchUsers(); // 重新获取用户列表
    } catch (error) {
      console.error('保存用户失败:', error);
      message.error(error.response?.data?.message || '保存用户失败，请重试');
    } finally {
      setLoading(false);
      setEditingUser(null);
    }
  };

  // 删除用户
  const handleDeleteUser = async (id) => {
    try {
      setLoading(true);
      const response = await axios.delete(`/api/users/${id}`);
      if (response.data.success) {
        message.success('用户删除成功');
        fetchUsers();
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      message.error('删除用户失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 切换用户状态
  const handleStatusChange = async (id, isActive) => {
    try {
      setLoading(true);
      const response = await axios.put(`/api/users/${id}`, {
        isActive: !isActive
      });
      if (response.data.success) {
        message.success(`用户已${!isActive ? '激活' : '停用'}`);
        fetchUsers();
      }
    } catch (error) {
      console.error('更新用户状态失败:', error);
      message.error('更新用户状态失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '工号',
      dataIndex: 'employeeId',
      key: 'employeeId',
      sorter: (a, b) => a.employeeId.localeCompare(b.employeeId),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      filters: departments.map(dept => ({ text: dept, value: dept })),
      onFilter: (value, record) => record.department === value,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: role => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '员工'}
        </Tag>
      ),
      filters: [
        { text: '管理员', value: 'admin' },
        { text: '员工', value: 'employee' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: '企业微信ID',
      dataIndex: 'wechatId',
      key: 'wechatId',
      render: wechatId => wechatId || '-',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'status',
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          checkedChildren="活跃"
          unCheckedChildren="停用"
          onChange={() => handleStatusChange(record._id, isActive)}
          disabled={record.role === 'admin' && record._id === editingUser?._id}
        />
      ),
      filters: [
        { text: '活跃', value: true },
        { text: '停用', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => showModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此用户吗?"
            onConfirm={() => handleDeleteUser(record._id)}
            okText="是"
            cancelText="否"
            disabled={record.role === 'admin'}
          >
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger
              disabled={record.role === 'admin'}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3}>人员管理</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchUsers}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>添加用户</Button>
        </Space>
      </div>

      <Modal
        title={editingUser ? `编辑用户: ${editingUser.name}` : '添加新用户'}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>取消</Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSaveUser} loading={loading}>
            保存
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          name="user_form"
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            name="employeeId"
            label="工号"
            rules={[{ required: true, message: '请输入工号' }]}
            disabled={!!editingUser}
          >
            <Input placeholder="请输入工号" />
          </Form.Item>

          <Form.Item
            name="department"
            label="部门"
            rules={[{ required: true, message: '请选择部门' }]}
          >
            <Input placeholder="请输入部门" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="employee">员工</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="wechatId"
            label="企业微信ID"
            tooltip="用于企业微信登录，不填则无法登录系统"
          >
            <Input placeholder="请输入企业微信ID" />
          </Form.Item>

          {editingUser && (
            <Form.Item
              name="isActive"
              label="状态"
            >
              <Switch checkedChildren="活跃" unCheckedChildren="停用" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={users.map(user => ({ ...user, key: user._id }))}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      )}
    </div>
  );
};

export default UserManagement;