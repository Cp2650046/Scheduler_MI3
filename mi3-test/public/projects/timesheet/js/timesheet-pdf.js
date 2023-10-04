async function generate_checklist_pdf(process_code_id, data) {
    let checklist_group = await map_checklist_group(data.detail)
    let content_head = await gen_checklist_head(process_code_id, data.head)
    let content_detail = await gen_checklist_body(checklist_group, data.detail)
    let content_remark = []
    let content_created = []
    if (process_code_id !== 14) {
        content_created = await gen_checklist_created(process_code_id, data.head.worker_name)
    } else {
        content_created = await gen_checklist_created_with_position(data.head.leader_name, data.head.leader_position, data.head.created)
    }

    if (process_code_id === 13) {
        content_remark = await gen_checklist_doc_remark(data.head.cqp_remark)
    } else if (process_code_id === 15) {
        content_remark = await gen_checklist_doc_remark()
    }


    var docDefinition = {
        pageSize: 'A4',
        pageMargins: [10, 15, 10, 15],
        info: {
            title: data.head.doc_name,
            author: '',
            subject: '',
            keywords: '',
        },
        content: [
            content_head,
            content_detail,
            content_remark,
            content_created
        ],
        download: true,
    };

    // Create the PDF document
    pdfMake.createPdf(docDefinition).open();
    // pdfMake.createPdf(docDefinition).download(data.head.doc_name + ".pdf");
}

async function gen_checklist_head(process_code_id, head) {
    var content_head = []
    var date_thai = await get_date_thai()
    switch (process_code_id) {
        case 13:
            content_head.push({
                alignment: 'right',
                text: 'FM-755-01-17 Rev.00',
                style: 'header',
                fontSize: 9,
                bold: false,
                // margin: []
            },
                {
                    margin: [0, 10, 0, 0],
                    table: {
                        headers: false,
                        widths: ['25%', '*', '25%'],
                        body: [
                            [{ text: `เลขที่เอกสาร : ${head.cqp_code}`, font: 'Sarabun', fontSize: 9, alignment: 'center' },
                            { text: head.doc_name, font: 'Sarabun', fontSize: 9, alignment: 'center' },
                            { text: 'วัน/เดือน/ปี : ' + date_thai, font: 'Sarabun', fontSize: 9, alignment: 'center' }],
                        ]
                    },
                },
                {
                    margin: [0, 10, 0, 0],
                    layout: 'noBorders',
                    table: {
                        headers: false,
                        widths: ['15%', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto',],
                        body: [
                            [{ text: 'Job ID: ', font: 'Sarabun', fontSize: 9 },
                            { text: head.jobid, font: 'Sarabun', fontSize: 9, bold: true, colSpan: 3 },
                            {},
                            {},
                            { text: 'Job Name', font: 'Sarabun', fontSize: 9 },
                            { text: head.job_name, font: 'Sarabun', fontSize: 9, bold: true, colSpan: 5 },
                            {},
                            {},
                            {},
                            {}],

                            [{ text: 'จำนวนงาน: ', font: 'Sarabun', fontSize: 9 },
                            { text: head.qty_plan, font: 'Sarabun', fontSize: 9, bold: true, colSpan: 3 },
                            {},
                            {},
                            { text: 'จำนวนพาเลท: ', font: 'Sarabun', fontSize: 9 },
                            { text: head.count_pallet, font: 'Sarabun', fontSize: 9, bold: true },
                            { text: 'ความสูงของพาเลท(cm): ', font: 'Sarabun', fontSize: 9 },
                            { text: head.trim_height, font: 'Sarabun', fontSize: 9, bold: true, colSpan: 3 },
                            {},
                            {}],

                            [{ text: 'ชื่อบริษัทจัดจ้าง: ', font: 'Sarabun', fontSize: 9 },
                            { text: head.cqp_outsource_name, font: 'Sarabun', fontSize: 9, bold: true, colSpan: 9 },
                            {},
                            {},
                            {},
                            {},
                            {},
                            {},
                            {},
                            {}],

                            [{ text: 'รายการจัดจ้าง: ', font: 'Sarabun', fontSize: 9 },
                            head.coat_choice !== 1 ?
                                {
                                    image: img.unchecked,
                                    width: 14,
                                    alignment: 'center'
                                } : {
                                    image: img.checked,
                                    width: 14,
                                    alignment: 'center'
                                },
                            { text: 'เคลื่อบ Hologram', font: 'Sarabun', fontSize: 9 },
                            head.coat_choice !== 2 ?
                                {
                                    image: img.unchecked,
                                    width: 14,
                                    alignment: 'center'
                                } : {
                                    image: img.checked,
                                    width: 14,
                                    alignment: 'center'
                                },
                            { text: 'เคลื่อบ Laminate', font: 'Sarabun', fontSize: 9 },
                            head.coat_choice !== 3 ?
                                {
                                    image: img.unchecked,
                                    width: 14,
                                    alignment: 'center'
                                } : {
                                    image: img.checked,
                                    width: 14,
                                    alignment: 'center'
                                },
                            { text: 'เคลื่อบฟอยด์', font: 'Sarabun', fontSize: 9 },
                            head.coat_choice !== 4 ?
                                {
                                    image: img.unchecked,
                                    width: 14,
                                    alignment: 'center'
                                } : {
                                    image: img.checked,
                                    width: 14,
                                    alignment: 'center'
                                },
                            { text: 'อื่นๆ: ', font: 'Sarabun', fontSize: 9 },
                            head.coat_choice !== 4 ?
                                { text: '..........................................', font: 'Sarabun', fontSize: 9 } : { text: head.coat_detail, font: 'Sarabun', fontSize: 9, alignment: 'left', bold: true }]
                        ]
                    }
                })
            break
        case 14:
            content_head.push({
                alignment: 'right',
                text: 'FM-751-11-11 Rev.03',
                style: 'header',
                fontSize: 9,
                bold: false,
                // margin: []
            },
                {
                    margin: [0, 10, 0, 0],
                    table: {
                        headers: false,
                        widths: ['25%', '50%', '25%'],
                        body: [
                            [{ text: `เลขที่เอกสาร : ${head.checklist_code}`, font: 'Sarabun', fontSize: 9, alignment: 'center' },
                            { text: head.doc_name, font: 'Sarabun', fontSize: 9, alignment: 'center' },
                            { text: 'วัน/เดือน/ปี : ' + await get_date_eng(), font: 'Sarabun', fontSize: 9, alignment: 'center' }],
                        ]
                    },
                },
                {
                    margin: [0, 10, 0, 0],
                    layout: 'noBorders',
                    table: {
                        headers: false,
                        widths: ['10%', '*', '10%', '60%'],
                        body: [
                            [{ text: 'Job ID: ', font: 'Sarabun', fontSize: 9 },
                            { text: head.jobid, font: 'Sarabun', fontSize: 9, bold: true },
                            { text: 'Job Name', font: 'Sarabun', fontSize: 9 },
                            { text: head.job_name, font: 'Sarabun', fontSize: 9, bold: true }],

                            [{ text: 'ชิ้นส่วน: ', font: 'Sarabun', fontSize: 9 },
                            { text: head.partName, font: 'Sarabun', fontSize: 9, colSpan: 3, bold: true },
                            {},
                            {}],

                            [{ text: 'เครื่องจักร: ', font: 'Sarabun', fontSize: 9 },
                            { text: head.machine_name, font: 'Sarabun', fontSize: 9, bold: true },
                            { text: 'กะการทำงาน', font: 'Sarabun', fontSize: 9 },
                            { text: head.shift_name, font: 'Sarabun', fontSize: 9, bold: true }],
                        ]
                    }
                })
            break
        case 15:
            let text = {
                docCodeGlobal: head.checklist_id === 1 ? "FM-751-11-11 Rev.03" : "FM-751-02-04 Rev.01",
                text1: head.checklist_id === 1 ? "จำนวนที่รับ" : "จำนวนกระดาษที่รับ",
                text2: head.checklist_id === 1 ? "จำนวนงานที่ต้องตัด" : "จำนวนกระดาษที่ต้องตัด",
                text_paper_cut_size: head.checklist_id === 1 ? head.paper_cut : `${head.paperwid}"x${head.paperlen}"`,
                text_paper_cut_qty: head.checklist_id === 1 ? head.paper_sheet : head.qty_paper_plan,
                text_paper_receive: head.checklist_id === 1 ? head.book_detail_qty : head.qty_paper_receive
            }
            content_head.push({
                alignment: 'right',
                text: text.docCodeGlobal,
                style: 'header',
                fontSize: 9,
                bold: false,
                // margin: []
            },
                {
                    margin: [0, 10, 0, 0],
                    table: {
                        headers: false,
                        widths: ['25%', '50%', '25%'],
                        body: [
                            [{ text: `เลขที่เอกสาร : ${head.qc_code}`, font: 'Sarabun', fontSize: 9, alignment: 'center' },
                            { text: head.doc_name, font: 'Sarabun', fontSize: 9, alignment: 'center' },
                            { text: 'วัน/เดือน/ปี : ' + date_thai, font: 'Sarabun', fontSize: 9, alignment: 'center' }],
                        ]
                    },
                },
                {
                    margin: [0, 10, 0, 0],
                    layout: 'noBorders',
                    table: {
                        headers: false,
                        widths: ['*', '*', '*', '30%', '10%', '10%'],
                        body: [
                            [{ text: 'Job ID: ', font: 'Sarabun', fontSize: 9 },
                            { text: head.jobid, font: 'Sarabun', fontSize: 9, bold: true },
                            { text: 'Job Name', font: 'Sarabun', fontSize: 9 },
                            { text: head.job_name, font: 'Sarabun', fontSize: 9, bold: true, colSpan: 3 },
                            {},
                            {}],

                            [{ text: 'ชิ้นส่วน: ', font: 'Sarabun', fontSize: 9 },
                            { text: head.partName, font: 'Sarabun', fontSize: 9, colSpan: 5, bold: true },
                            {},
                            {},
                            {},
                            {}],

                            [{ text: `${text.text1}: `, font: 'Sarabun', fontSize: 9 },
                            { text: text.text_paper_receive, font: 'Sarabun', fontSize: 9, bold: true, },
                            { text: `${text.text2}: `, font: 'Sarabun', fontSize: 9 },
                            { text: text.text_paper_cut_qty, font: 'Sarabun', fontSize: 9, bold: true, colSpan: 3 },
                            {},
                            {}],

                            [{ text: 'ขนาดกระดาษที่ต้องตัด: ', font: 'Sarabun', fontSize: 9 },
                            { text: text.text_paper_cut_size, font: 'Sarabun', fontSize: 9, bold: true, },
                            { text: 'เครื่องจักร: ', font: 'Sarabun', fontSize: 9 },
                            { text: head.machine_name, font: 'Sarabun', fontSize: 9, bold: true },
                            { text: 'กะการทำงาน', font: 'Sarabun', fontSize: 9 },
                            { text: head.shift_name, font: 'Sarabun', fontSize: 9, bold: true }],
                        ]
                    }
                })
            break
    }

    return content_head
}

async function gen_checklist_body(checklist_group, detail) {
    var content_detail = []
    for (const group of checklist_group) {
        let table_body = [
            [{ text: group.checklist_group_name, font: 'Sarabun', fontSize: 9, bold: true, colSpan: 5, fillColor: '#B4B4B3' },
            {},
            {},
            {},
            {}],
            [{ text: 'ลำดับ', font: 'Sarabun', fontSize: 9, bold: true, alignment: 'center' },
            { text: 'รายการตรวจสอบ', font: 'Sarabun', fontSize: 9, bold: true, alignment: 'center' },
            { text: 'ปกติ', font: 'Sarabun', fontSize: 9, bold: true, alignment: 'center' },
            { text: 'ผิดปกติ', font: 'Sarabun', fontSize: 9, bold: true, alignment: 'center' },
            { text: 'หมายเหตุ', font: 'Sarabun', fontSize: 9, bold: true, alignment: 'center' }],
        ]
        let count = 0;
        for (const list of detail) {
            if (list.checklist_group_id === group.checklist_group_id) {
                count++
                table_body.push([
                    { text: count, font: 'Sarabun', fontSize: 9, alignment: 'center' },
                    { text: list.detail_name, font: 'Sarabun', fontSize: 9 },
                    list.detail_value === 1 ?
                        {
                            image: img.correct,
                            width: 10,
                            alignment: 'center'
                        } : { text: ``, font: 'Roboto', fontSize: 10, alignment: 'center' },
                    list.detail_value === 0 ?
                        {
                            image: img.correct,
                            width: 10,
                            alignment: 'center'
                        } : { text: ``, font: 'Roboto', fontSize: 10, alignment: 'center' },
                    { text: list.detail_remark, font: 'Sarabun', fontSize: 9 }
                ])
            }
        }
        content_detail.push({
            margin: [0, 10, 0, 0],
            table: {
                headers: true,
                widths: ['auto', '50%', '6%', '6%', '*'],
                body: table_body,
            },
        })
    }
    return content_detail
}

async function gen_checklist_doc_remark(remark = null) {
    var content_remark = []
    if (remark === null) {
        content_remark.push({
            layout: 'noBorders',
            margin: [0, 10, 0, 0],
            table: {
                headers: true,
                widths: ['10%', '90%'],
                body: [
                    [
                        { text: 'หมายเหตุ: ', font: 'Sarabun', fontSize: 9 },
                        { text: '................................................................................................................................................................................................................................', font: 'Sarabun', fontSize: 9 }
                    ],
                    [
                        { text: '', font: 'Sarabun', fontSize: 9 },
                        { text: '................................................................................................................................................................................................................................', font: 'Sarabun', fontSize: 9 }
                    ],
                    [
                        { text: '', font: 'Sarabun', fontSize: 9 },
                        { text: '................................................................................................................................................................................................................................', font: 'Sarabun', fontSize: 9 }
                    ],
                    [
                        { text: '', font: 'Sarabun', fontSize: 9 },
                        { text: '................................................................................................................................................................................................................................', font: 'Sarabun', fontSize: 9 }
                    ],
                    [
                        { text: '', font: 'Sarabun', fontSize: 9 },
                        { text: '................................................................................................................................................................................................................................', font: 'Sarabun', fontSize: 9 }
                    ]
                ]
            },
        })
    } else {
        content_remark.push({
            layout: 'noBorders',
            margin: [0, 10, 0, 20],
            table: {
                headers: true,
                widths: ['10%', '90%'],
                body: [
                    [
                        { text: 'หมายเหตุ: ', font: 'Sarabun', fontSize: 9 },
                        { text: remark, font: 'Sarabun', fontSize: 9 }
                    ],
                ]
            },
        })
    }

    return content_remark
}

async function gen_checklist_created(process_code_id, emp_name) {
    var content_created = []
    switch (process_code_id) {
        case 13:
            content_created.push({
                layout: 'noBorders',
                margin: [0, 10, 0, 0],
                table: {
                    headers: true,
                    widths: ['20%', '*', '20%', '*'],
                    body: [
                        [
                            {
                                image: img.checked,
                                width: 14,
                                alignment: 'right'
                            },
                            {
                                text: 'งานพร้อมส่งมอบ', font: 'Sarabun', fontSize: 9, alignment: 'left'
                            },
                            {
                                image: img.unchecked,
                                width: 14,
                                alignment: 'right'
                            },
                            {
                                text: 'งานพร้อมรับมอบ', font: 'Sarabun', fontSize: 9, alignment: 'left'
                            }
                        ],

                        [{ text: 'ลงชื่อ : ' + emp_name, font: 'Sarabun', fontSize: 9, alignment: 'center', colSpan: 2 },
                        {},
                        { text: 'ลงชื่อ : ...............................................', font: 'Sarabun', fontSize: 9, alignment: 'center', colSpan: 2 },
                        {}],

                        [{ text: 'คลังซัพพลาย', font: 'Sarabun', fontSize: 9, alignment: 'center', colSpan: 2 },
                        {},
                        { text: 'ฝ่าย Outsource', font: 'Sarabun', fontSize: 9, alignment: 'center', colSpan: 2 },
                        {}]
                    ]
                },
            })
            break
        case 15:
            content_created.push({
                layout: 'noBorders',
                margin: [0, 10, 0, 0],
                table: {
                    headers: true,
                    widths: ['*', '20%'],
                    body: [
                        [
                            { text: '', font: 'Sarabun', fontSize: 9 },
                            { text: emp_name, font: 'Sarabun', fontSize: 9, alignment: 'center' }
                        ],
                        [
                            { text: '', font: 'Sarabun', fontSize: 9 },
                            { text: '(ผู้บันทึก)', font: 'Sarabun', fontSize: 9, alignment: 'center' }
                        ]
                    ]
                },
            })
            break

    }
    return content_created
}

async function gen_checklist_created_with_position(emp_name, emp_position, created) {
    var content_created = []
    content_created.push({
        layout: 'noBorders',
        margin: [0, 10, 0, 0],
        table: {
            headers: true,
            widths: ['*', '10%', '20%'],
            body: [
                [
                    { text: '', font: 'Sarabun', fontSize: 9 },
                    { text: 'ผู้อนุมัติ: ', font: 'Sarabun', fontSize: 9, alignment: 'right' },
                    { text: emp_name, font: 'Sarabun', fontSize: 9, alignment: 'center' }
                ],
                [
                    { text: '', font: 'Sarabun', fontSize: 9 },
                    { text: 'ตำแหน่ง: ', font: 'Sarabun', fontSize: 9, alignment: 'right' },
                    { text: emp_position, font: 'Sarabun', fontSize: 9, alignment: 'center' }
                ],
                [
                    { text: '', font: 'Sarabun', fontSize: 9 },
                    { text: 'วันที่: ', font: 'Sarabun', fontSize: 9, alignment: 'right' },
                    { text: created, font: 'Sarabun', fontSize: 9, alignment: 'center' }
                ]

            ]
        },
    })
    return content_created
}

async function map_checklist_group(detail) {
    const group_map = new Map();

    detail.forEach((item) => {
        const { checklist_group_id, checklist_group_name } = item;
        const key = `${checklist_group_id}_${checklist_group_name}`;
        if (!group_map.has(key)) {
            group_map.set(key, { checklist_group_id, checklist_group_name });
        }
    });

    const resultArray = Array.from(group_map.values());
    return resultArray
}

async function get_date_thai() {
    const currentDate = new Date();
    // Calculate the Thai Buddhist year (add 543 years)
    const thaiYear = currentDate.getFullYear() + 543;
    // Format the date as dd/mm/yyyy
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
    const year = thaiYear.toString();

    const formattedDate = `${day}/${month}/${year}`;
    return formattedDate
}

async function get_date_eng() {
    const currentDate = new Date();
    const thaiYear = currentDate.getFullYear();
    // Format the date as dd/mm/yyyy
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
    const year = thaiYear.toString();

    const formattedDate = `${day}/${month}/${year}`;
    return formattedDate
}