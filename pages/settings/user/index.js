import { Button, Divider, Input, Table } from "antd"
import Link from "next/link"
import React from "react"
import Swal from "sweetalert2"
import axios from "../../../axios"
import Head from "../../../components/head"
import Layout from "../../../components/layout"
import withAuth from '../../../hoc/authHandler'
import Aux from "../../../hoc/Auxiliary"

class Index extends React.Component {
  state = {
    users: [],
    loading: false,
    filterKey: ""
  }

  componentDidMount() {
    this.fetchUsers()
  }

  filteredData = () => {
    const { users, filterKey } = this.state
    const data = []
    if (users.length) {
      if (filterKey) {
        const newUsers = users.filter(function(row) {
          return Object.keys(row).some(function(key) {
            return (
              String(row[key])
                .toLowerCase()
                .indexOf(filterKey) > -1
            )
          })
        })
        newUsers.map((user, index) => {
          data.push(Object.assign(user, { key: index + 1 }))
        })
      } else {
        users.map((user, index) => {
          data.push(Object.assign(user, { key: index + 1 }))
        })
      }
    }
    return data
  }

  fetchUsers = async () => {
    try {
      this.setState({ loading: true })
      const { data } = await axios.get(`/user/index`)
      this.setState({ users: data, loading: false })
    } catch (error) {
      this.setState({ loading: false })
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: error.message
      })
    }
  }

  onDelete = user => {
    const _this = this
    Swal.fire({
      title: "ต้องการลบผู้ใช้งานใช่หรือไม่?",
      text: "",
      type: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบรายการ",
      cancelButtonText: "ยกเลิก",
      showLoaderOnConfirm: true,
      allowOutsideClick: false,
      preConfirm: function() {
        return new Promise(function(resolve) {
          axios
            .delete(`/user/delete/${user.id}`)
            .then(res => {
              _this.fetchUsers()
              resolve(res.data)
            })
            .catch(error => {
              Swal.fire({
                type: "error",
                title: "Oops...",
                text: error.message
              })
            })
        })
      }
    }).then(result => {
      if (result.value) {
        Swal.fire("Deleted!", result.value.message, "success")
      }
    })
  }

  handleSubmit = event => {
    event.preventDefault()
  }

  handleChangeInput = event => {
    this.setState({ filterKey: event.target.value })
  }

  render() {
    const columns = [
      {
        title: "ชื่อผู้ใช้งาน",
        dataIndex: "username",
        key: "username",
        render: text => <a>{text}</a>,
        sorter: true,
      },
      {
        title: "ชื่อ-นามสกุล",
        dataIndex: "name",
        key: "name",
        sorter: true,
      },
      {
        title: "อีเมล",
        dataIndex: "email",
        key: "email",
        sorter: true,
      },
      {
        title: "Action",
        key: "action",
        align: "center",
        render: (text, record) => (
          <span>
            <Link
              href={`/settings/user/[id]`}
              as={`/settings/user/${record.id}`}
            >
              <Button type="primary">แก้ไข</Button>
            </Link>
            <Divider type="vertical" />
            <Button type="danger" onClick={() => this.onDelete(record)}>
              ลบ
            </Button>
          </span>
        )
      }
    ]

    return (
      <Aux>
        <Head title="รายชื่อผู้ใช้งาน" />
        <Layout title="รายชื่อผู้ใช้งาน" breadcrumb="รายชื่อผู้ใช้งาน">
          <div className="row">
            <div className="col-md-12">
              <div className="box">
                <div className="box-header with-border">
                  <h3 className="box-title">ตั้งค่าผู้ใช้งาน</h3>
                </div>
                {/* /.box-header */}
                <div className="box-body">
                  <div className="row">
                    <div className="col-md-12">
                      <form onSubmit={this.handleSubmit}>
                        <div className="form-group">
                          <div className="col-md-4">
                            <Input
                              placeholder="ค้นหา..."
                              value={this.state.filterKey}
                              onChange={this.handleChangeInput}
                            />
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                  <br />
                  <div className="row">
                    <div className="col-md-12">
                      <Table
                        loading={this.state.loading}
                        columns={columns}
                        dataSource={this.filteredData()}
                        rowKey="id"
                      />
                    </div>
                  </div>
                </div>
                {/* /.box-body */}
                <div className="box-footer clearfix"></div>
              </div>
            </div>
          </div>
          <style jsx global>{`
            .text-center {
              text-align: center !important;
            }
          `}</style>
        </Layout>
      </Aux>
    )
  }
}

export default withAuth(Index)
